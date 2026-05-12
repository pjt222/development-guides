//! The open grimoire — a two-page spread (index of entries · the open entry)
//! with fore-edge thumb tabs down the right margin for the four volumes:
//! Spells (skills), Companions (agents), Fellowships (teams), Tomes (guides).

use std::path::Path;

use crossterm::event::{KeyCode, KeyModifiers};
use ratatui::layout::{Alignment, Constraint, Direction, Layout, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{
    Block, BorderType, Borders, Clear, List, ListItem, ListState, Paragraph, Wrap,
};
use ratatui::Frame;

use crate::app::App;
use crate::content::body::{BodyCache, CachedBody};
use crate::content::registry::{
    AgentSummary, GuideSummary, Registries, SkillSummary, TeamSummary,
};
use crate::search::FuzzyIndex;
use crate::theme;

// ── volumes ──────────────────────────────────────────────────────────────────

/// The four bound volumes of the grimoire.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Volume {
    Spells,
    Companions,
    Fellowships,
    Tomes,
}

impl Volume {
    pub const ALL: [Volume; 4] = [
        Volume::Spells,
        Volume::Companions,
        Volume::Fellowships,
        Volume::Tomes,
    ];

    pub fn index(self) -> usize {
        match self {
            Volume::Spells => 0,
            Volume::Companions => 1,
            Volume::Fellowships => 2,
            Volume::Tomes => 3,
        }
    }

    pub fn from_index(i: usize) -> Volume {
        Volume::ALL[i % 4]
    }

    pub fn next(self) -> Volume {
        Volume::from_index(self.index() + 1)
    }

    pub fn prev(self) -> Volume {
        Volume::from_index(self.index() + 3)
    }

    /// Plural name shown on the index pane and the thumb tab.
    pub fn label(self) -> &'static str {
        match self {
            Volume::Spells => "Spells",
            Volume::Companions => "Companions",
            Volume::Fellowships => "Fellowships",
            Volume::Tomes => "Tomes",
        }
    }

    /// Singular noun used in the footer ("Spell 47 of 352").
    pub fn singular(self) -> &'static str {
        match self {
            Volume::Spells => "Spell",
            Volume::Companions => "Companion",
            Volume::Fellowships => "Fellowship",
            Volume::Tomes => "Tome",
        }
    }

    pub fn color(self) -> ratatui::style::Color {
        match self {
            Volume::Spells => theme::VOLUME_SPELLS,
            Volume::Companions => theme::VOLUME_COMPANIONS,
            Volume::Fellowships => theme::VOLUME_FELLOWSHIPS,
            Volume::Tomes => theme::VOLUME_TOMES,
        }
    }
}

// ── entries ──────────────────────────────────────────────────────────────────

/// One catalogue entry, of whichever kind the active volume holds.
#[derive(Debug, Clone)]
pub enum Entry {
    Skill(SkillSummary),
    Agent(AgentSummary),
    Team(TeamSummary),
    Guide(GuideSummary),
}

impl Entry {
    pub fn id(&self) -> &str {
        match self {
            Entry::Skill(s) => &s.id,
            Entry::Agent(a) => &a.id,
            Entry::Team(t) => &t.id,
            Entry::Guide(g) => &g.id,
        }
    }

    /// The string the fuzzy search matches against.
    fn search_key(&self) -> &str {
        self.id()
    }

    /// What an index row shows — the prettier title for guides, the id otherwise.
    fn list_label(&self) -> &str {
        match self {
            Entry::Guide(g) => &g.title,
            other => other.id(),
        }
    }

    /// Full title shown on the open page header.
    pub fn title(&self) -> &str {
        self.list_label()
    }

    pub fn description(&self) -> &str {
        match self {
            Entry::Skill(s) => &s.description,
            Entry::Agent(a) => &a.description,
            Entry::Team(t) => &t.description,
            Entry::Guide(g) => &g.description,
        }
    }

    /// Short, kind-specific tagline shown in the footer next to the count.
    fn subtitle(&self) -> String {
        match self {
            Entry::Skill(s) => format!("School of {}", s.domain),
            Entry::Agent(a) if !a.priority.is_empty() => format!("{} priority", a.priority),
            Entry::Agent(_) => "companion".to_string(),
            Entry::Team(t) if !t.coordination.is_empty() => {
                format!("{} formation", t.coordination)
            }
            Entry::Team(_) => "fellowship".to_string(),
            Entry::Guide(g) if !g.category.is_empty() => format!("{} tome", g.category),
            Entry::Guide(_) => "tome".to_string(),
        }
    }
}

// ── per-volume index state ───────────────────────────────────────────────────

pub struct VolumeIndex {
    pub items: Vec<Entry>,
    /// Indices into `items` currently shown (all of them when no search query).
    pub filtered: Vec<usize>,
    pub list_state: ListState,
    pub search_query: String,
    pub scroll: u16,
}

impl VolumeIndex {
    fn new(items: Vec<Entry>) -> Self {
        let filtered: Vec<usize> = (0..items.len()).collect();
        let mut list_state = ListState::default();
        if !items.is_empty() {
            list_state.select(Some(0));
        }
        Self {
            items,
            filtered,
            list_state,
            search_query: String::new(),
            scroll: 0,
        }
    }

    pub fn selected(&self) -> Option<&Entry> {
        let row = self.list_state.selected()?;
        let real = *self.filtered.get(row)?;
        self.items.get(real)
    }

    fn move_cursor(&mut self, delta: isize) {
        if self.filtered.is_empty() {
            return;
        }
        let len = self.filtered.len() as isize;
        let cur = self.list_state.selected().unwrap_or(0) as isize;
        let next = (cur + delta).clamp(0, len - 1);
        self.list_state.select(Some(next as usize));
        self.scroll = 0;
    }

    fn jump(&mut self, to_top: bool) {
        if self.filtered.is_empty() {
            return;
        }
        let target = if to_top { 0 } else { self.filtered.len() - 1 };
        self.list_state.select(Some(target));
        self.scroll = 0;
    }

    fn scroll_page(&mut self, delta: i16) {
        if delta < 0 {
            self.scroll = self.scroll.saturating_sub((-delta) as u16);
        } else {
            self.scroll = self.scroll.saturating_add(delta as u16);
        }
    }

    fn apply_filter(&mut self, filtered: Vec<usize>) {
        self.filtered = filtered;
        self.list_state
            .select(if self.filtered.is_empty() { None } else { Some(0) });
        self.scroll = 0;
    }
}

// ── screen state ─────────────────────────────────────────────────────────────

pub struct State {
    pub volume: Volume,
    pub volumes: [VolumeIndex; 4],
    pub body_cache: BodyCache,
    pub fuzzy: FuzzyIndex,
    pub search_mode: bool,
}

impl State {
    pub fn new(registries: &Registries, root: Option<&Path>) -> Self {
        let volumes = [
            VolumeIndex::new(
                registries
                    .skills
                    .flat()
                    .into_iter()
                    .map(Entry::Skill)
                    .collect(),
            ),
            VolumeIndex::new(
                registries
                    .agents
                    .flat()
                    .into_iter()
                    .map(Entry::Agent)
                    .collect(),
            ),
            VolumeIndex::new(
                registries
                    .teams
                    .flat()
                    .into_iter()
                    .map(Entry::Team)
                    .collect(),
            ),
            VolumeIndex::new(
                registries
                    .guides
                    .flat()
                    .into_iter()
                    .map(Entry::Guide)
                    .collect(),
            ),
        ];
        Self {
            volume: Volume::Spells,
            volumes,
            body_cache: BodyCache::new(root),
            fuzzy: FuzzyIndex::default(),
            search_mode: false,
        }
    }

    fn cur(&self) -> &VolumeIndex {
        &self.volumes[self.volume.index()]
    }

    fn cur_mut(&mut self) -> &mut VolumeIndex {
        let i = self.volume.index();
        &mut self.volumes[i]
    }

    fn set_volume(&mut self, volume: Volume) {
        if self.volume != volume {
            self.volume = volume;
            self.search_mode = false;
        }
    }

    // -- cursor / scrolling, delegated to the active volume --

    fn move_cursor(&mut self, delta: isize) {
        self.cur_mut().move_cursor(delta);
    }

    fn jump(&mut self, to_top: bool) {
        self.cur_mut().jump(to_top);
    }

    fn scroll_page(&mut self, delta: i16) {
        self.cur_mut().scroll_page(delta);
    }

    // -- search --

    pub fn search_query(&self) -> &str {
        &self.cur().search_query
    }

    fn enter_search(&mut self) {
        self.search_mode = true;
    }

    fn exit_search(&mut self, commit: bool) {
        self.search_mode = false;
        if !commit {
            self.cur_mut().search_query.clear();
            self.recompute_filter();
        }
    }

    fn append_query(&mut self, ch: char) {
        self.cur_mut().search_query.push(ch);
        self.recompute_filter();
    }

    fn pop_query(&mut self) {
        self.cur_mut().search_query.pop();
        self.recompute_filter();
    }

    fn clear_query(&mut self) -> bool {
        if self.cur().search_query.is_empty() {
            return false;
        }
        self.cur_mut().search_query.clear();
        self.recompute_filter();
        true
    }

    fn recompute_filter(&mut self) {
        let i = self.volume.index();
        let query = self.volumes[i].search_query.clone();
        let filtered = self
            .fuzzy
            .filter(&self.volumes[i].items, &query, |e| e.search_key());
        self.volumes[i].apply_filter(filtered);
    }

    // -- the open page --

    fn selected_entry(&self) -> Option<Entry> {
        self.cur().selected().cloned()
    }

    /// Load (and cache) the full body for the selected entry, if a `--root`
    /// was supplied.
    fn selected_body(&mut self) -> Option<&CachedBody> {
        let entry = self.cur().selected().cloned()?;
        match entry {
            Entry::Skill(s) => self.body_cache.get_skill(&s.id, &s.path),
            Entry::Agent(a) => self.body_cache.get_agent(&a.id, &a.path),
            Entry::Team(t) => self.body_cache.get_team(&t.id, &t.path),
            Entry::Guide(g) => self.body_cache.get_guide(&g.id, &g.path),
        }
    }
}

// ── drawing ──────────────────────────────────────────────────────────────────

const INDEX_WIDTH: u16 = 38;
const TABS_WIDTH: u16 = 4;
/// Page area never shrinks below this — past it, the index pane gives way.
const MIN_PAGE_WIDTH: u16 = 24;

pub fn draw(frame: &mut Frame<'_>, app: &mut App) {
    let area = frame.area();
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(1)])
        .split(area);

    // Index · page · fore-edge tabs. The index pane's right border meets the
    // page's left border to form the book's centre spine — no separate gutter.
    let cols = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Max(INDEX_WIDTH),
            Constraint::Min(MIN_PAGE_WIDTH),
            Constraint::Length(TABS_WIDTH),
        ])
        .split(rows[0]);

    draw_index(frame, cols[0], app);
    draw_page(frame, cols[1], app);
    draw_tabs(frame, cols[2], app.spellbook.volume);

    frame.render_widget(make_footer(app), rows[1]);

    if app.spellbook.search_mode {
        draw_search_overlay(frame, area, &app.spellbook);
    }
}

fn draw_index(frame: &mut Frame<'_>, area: Rect, app: &mut App) {
    let sb = &mut app.spellbook;
    let volume = sb.volume;
    let idx = &mut sb.volumes[volume.index()];

    let title = if idx.search_query.is_empty() {
        format!(" {} · {} ", volume.label(), idx.items.len())
    } else {
        format!(
            " {} · /{} ({}) ",
            volume.label(),
            idx.search_query,
            idx.filtered.len()
        )
    };
    let block = Block::default()
        .title(title)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(theme::accent(volume.color()));

    let items: Vec<ListItem> = idx
        .filtered
        .iter()
        .filter_map(|&i| idx.items.get(i))
        .map(|e| ListItem::new(e.list_label().to_string()))
        .collect();
    let list = List::new(items)
        .block(block)
        .style(theme::body())
        .highlight_style(theme::highlight())
        .highlight_symbol("▶ ");
    frame.render_stateful_widget(list, area, &mut idx.list_state);
}

fn draw_page(frame: &mut Frame<'_>, area: Rect, app: &mut App) {
    let volume = app.spellbook.volume;
    let title = app
        .spellbook
        .selected_entry()
        .map(|e| format!(" {} ", e.title()))
        .unwrap_or_else(|| " (empty) ".to_string());
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_type(BorderType::Double)
        .border_style(theme::accent(volume.color()));
    let inner = block.inner(area);
    frame.render_widget(block, area);

    let scroll = app.spellbook.cur().scroll;
    let lines = build_page_lines(app);
    let para = Paragraph::new(Text::from(lines))
        .style(theme::body())
        .scroll((scroll, 0))
        .wrap(Wrap { trim: false });
    frame.render_widget(para, inner);
}

/// Minimal page body shared by all kinds (Step 3): a small header, then either
/// the rendered markdown body (with `--root`) or the description plus a hint.
/// Per-kind page layouts arrive in Step 4.
fn build_page_lines(app: &mut App) -> Vec<Line<'static>> {
    let Some(entry) = app.spellbook.selected_entry() else {
        return vec![Line::from("This volume holds no such page.")];
    };
    let mut lines = Vec::new();
    lines.push(Line::from(Span::styled(
        format!("{} · {}", entry_kind_label(&entry), entry.subtitle()),
        theme::accent(theme::FLAME_HOT),
    )));
    lines.push(Line::default());

    if let Some(body) = app.spellbook.selected_body() {
        lines.extend(body.rendered.iter().cloned());
    } else {
        lines.push(Line::from(Span::styled(
            entry.description().to_string(),
            theme::body(),
        )));
        lines.push(Line::default());
        lines.push(Line::from(Span::styled(
            "— the full page is sealed; pass --root <agent-almanac> to break the wax —",
            theme::dim_text(),
        )));
    }
    lines
}

fn entry_kind_label(entry: &Entry) -> &'static str {
    match entry {
        Entry::Skill(_) => "Spell",
        Entry::Agent(_) => "Companion",
        Entry::Team(_) => "Fellowship",
        Entry::Guide(_) => "Tome",
    }
}

/// Fore-edge thumb tabs: one coloured band per volume down the right margin,
/// the active one bright with a left-pointing notch and its keybind number.
fn draw_tabs(frame: &mut Frame<'_>, area: Rect, active: Volume) {
    if area.height == 0 || area.width == 0 {
        return;
    }
    let n = Volume::ALL.len() as u16;
    let band_h = (area.height / n).max(1);
    for (i, vol) in Volume::ALL.iter().enumerate() {
        let i = i as u16;
        let y = area.y + band_h * i;
        if y >= area.bottom() {
            break;
        }
        let h = if i == n - 1 {
            area.bottom().saturating_sub(y)
        } else {
            band_h
        };
        if h == 0 {
            continue;
        }
        let band = Rect::new(area.x, y, area.width, h);
        let is_active = *vol == active;
        // All four bands are coloured (a real thumb-index shows every section);
        // the inactive ones are darkened so the active one reads as raised.
        let bg = if is_active { vol.color() } else { darken(vol.color(), 0.45) };
        let mut style = Style::default().bg(bg).fg(theme::NIGHT_BG);
        if is_active {
            style = style.add_modifier(Modifier::BOLD);
        }
        let mid = h / 2;
        let width = area.width as usize;
        let text: Vec<Line> = (0..h)
            .map(|row| {
                let content = if row == mid {
                    let label = if is_active {
                        format!("◀{}", i + 1)
                    } else {
                        format!(" {}", i + 1)
                    };
                    format!("{label:<width$}")
                } else {
                    " ".repeat(width)
                };
                Line::from(Span::styled(content, style))
            })
            .collect();
        frame.render_widget(Paragraph::new(text).style(style), band);
    }
}

/// Scale an RGB colour toward black by `factor` (0 = black, 1 = unchanged).
fn darken(color: ratatui::style::Color, factor: f32) -> ratatui::style::Color {
    match color {
        ratatui::style::Color::Rgb(r, g, b) => {
            let s = |v: u8| (v as f32 * factor).round().clamp(0.0, 255.0) as u8;
            ratatui::style::Color::Rgb(s(r), s(g), s(b))
        }
        other => other,
    }
}

fn make_footer(app: &App) -> Paragraph<'static> {
    let sb = &app.spellbook;
    let idx = sb.cur();
    let total = idx.filtered.len();
    let cur = idx.list_state.selected().map(|i| i + 1).unwrap_or(0);
    let lead = match sb.selected_entry().map(|e| e.subtitle()) {
        Some(sub) if !sub.is_empty() => {
            format!(" {} {}/{} · {}", sb.volume.singular(), cur, total, sub)
        }
        _ => format!(" {} {}/{}", sb.volume.singular(), cur, total),
    };
    Paragraph::new(format!(
        "{lead}    [j/k] turn · [/] search · [Tab] volume · [J/K] scroll · [Esc] back · [q] close"
    ))
    .style(theme::dim_text())
}

fn draw_search_overlay(frame: &mut Frame<'_>, area: Rect, state: &State) {
    let width = area.width.clamp(20, 60);
    let height = 3u16;
    let x = area.x + area.width.saturating_sub(width) / 2;
    let y = area.y + area.height.saturating_sub(height) / 2;
    let popup = Rect::new(x, y, width, height);
    frame.render_widget(Clear, popup);
    let block = Block::default()
        .title(" speak a name ")
        .borders(Borders::ALL)
        .border_type(BorderType::Double)
        .border_style(theme::accent(state.volume.color()));
    let inner = block.inner(popup);
    frame.render_widget(block, popup);
    let para = Paragraph::new(format!("/{}_", state.search_query())).style(theme::body());
    frame.render_widget(para, inner);
}

// ── key handling ─────────────────────────────────────────────────────────────

pub fn handle_key(app: &mut App, code: KeyCode, mods: KeyModifiers) {
    if app.spellbook.search_mode {
        match code {
            KeyCode::Esc => app.spellbook.exit_search(false),
            KeyCode::Enter => app.spellbook.exit_search(true),
            KeyCode::Backspace => app.spellbook.pop_query(),
            KeyCode::Char(ch) if !mods.contains(KeyModifiers::CONTROL) => {
                app.spellbook.append_query(ch)
            }
            _ => {}
        }
        return;
    }

    match code {
        // volume switching
        KeyCode::Char('1') => app.spellbook.set_volume(Volume::Spells),
        KeyCode::Char('2') => app.spellbook.set_volume(Volume::Companions),
        KeyCode::Char('3') => app.spellbook.set_volume(Volume::Fellowships),
        KeyCode::Char('4') => app.spellbook.set_volume(Volume::Tomes),
        KeyCode::Char(']') | KeyCode::Tab => {
            let next = app.spellbook.volume.next();
            app.spellbook.set_volume(next);
        }
        KeyCode::Char('[') | KeyCode::BackTab => {
            let prev = app.spellbook.volume.prev();
            app.spellbook.set_volume(prev);
        }

        // search
        KeyCode::Char('/') => app.spellbook.enter_search(),

        // navigation within a volume
        KeyCode::Char('j') | KeyCode::Down => app.spellbook.move_cursor(1),
        KeyCode::Char('k') | KeyCode::Up => app.spellbook.move_cursor(-1),
        KeyCode::PageDown => app.spellbook.move_cursor(10),
        KeyCode::PageUp => app.spellbook.move_cursor(-10),
        KeyCode::Char('g') | KeyCode::Home => app.spellbook.jump(true),
        KeyCode::Char('G') | KeyCode::End => app.spellbook.jump(false),
        KeyCode::Char('J') => app.spellbook.scroll_page(2),
        KeyCode::Char('K') => app.spellbook.scroll_page(-2),

        // escape ladder: clear a search filter first; if there was none, close
        // the book (the guard's `clear_query` does the clearing as a side effect).
        KeyCode::Esc if !app.spellbook.clear_query() => {
            app.screen = crate::app::Screen::Cover;
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::content::registry;

    #[test]
    fn volumes_cycle_in_order() {
        assert_eq!(Volume::Spells.next(), Volume::Companions);
        assert_eq!(Volume::Tomes.next(), Volume::Spells);
        assert_eq!(Volume::Spells.prev(), Volume::Tomes);
        for v in Volume::ALL {
            assert_eq!(Volume::from_index(v.index()), v);
            assert_eq!(v.next().prev(), v);
        }
    }

    #[test]
    fn state_has_four_populated_volumes() {
        let r = registry::load(None).expect("registries");
        let state = State::new(&r, None);
        assert_eq!(state.volumes[0].items.len(), r.skills.total());
        assert_eq!(state.volumes[1].items.len(), r.agents.total());
        assert_eq!(state.volumes[2].items.len(), r.teams.total());
        assert_eq!(state.volumes[3].items.len(), r.guides.total());
        for vi in &state.volumes {
            assert!(!vi.items.is_empty());
            assert_eq!(vi.filtered.len(), vi.items.len());
        }
    }

    #[test]
    fn search_query_is_per_volume() {
        let r = registry::load(None).expect("registries");
        let mut state = State::new(&r, None);
        // type a query in Spells
        state.enter_search();
        state.append_query('g');
        state.append_query('i');
        state.append_query('t');
        let spells_filtered = state.cur().filtered.len();
        assert!(spells_filtered > 0 && spells_filtered < state.cur().items.len());
        // switch volume: the new volume is unfiltered, search mode reset
        state.set_volume(Volume::Companions);
        assert!(!state.search_mode);
        assert!(state.search_query().is_empty());
        assert_eq!(state.cur().filtered.len(), state.cur().items.len());
        // switch back: the original query is still there
        state.set_volume(Volume::Spells);
        assert_eq!(state.search_query(), "git");
        assert_eq!(state.cur().filtered.len(), spells_filtered);
    }

    #[test]
    fn move_cursor_stays_in_bounds() {
        let r = registry::load(None).expect("registries");
        let mut state = State::new(&r, None);
        state.move_cursor(-5);
        assert_eq!(state.cur().list_state.selected(), Some(0));
        state.move_cursor(1_000_000);
        assert_eq!(
            state.cur().list_state.selected(),
            Some(state.cur().items.len() - 1)
        );
    }
}

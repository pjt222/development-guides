//! The cover — the grimoire lying closed on a table by the fire.
//!
//! This is the first thing the reader sees: the reading light above, the
//! embossed cover below, the inscription of what is bound within, and the
//! prompt to open it. Any key opens the book (→ the [`super::spellbook`]
//! screen); `q` leaves the fire entirely.

use crossterm::event::{KeyCode, KeyModifiers};
use ratatui::layout::{Alignment, Constraint, Direction, Layout, Rect};
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::Paragraph;
use ratatui::Frame;

use crate::app::{App, Screen};
use crate::pixels::flame;
use crate::theme;

/// The embossed cover plate, drawn in box characters. Centred under the flame.
const COVER_PLATE: &[&str] = &[
    "╔══════════════════════════╗",
    "║ ┌──────────────────────┐ ║",
    "║ │                      │ ║",
    "║ │   A G E N T          │ ║",
    "║ │   A L M A N A C       │ ║",
    "║ │                      │ ║",
    "║ │   ✦   a grimoire  ✦  │ ║",
    "║ │                      │ ║",
    "║ └──────────────────────┘ ║",
    "╚══════════════════════════╝",
];

pub fn draw(frame: &mut Frame<'_>, app: &App) {
    let area = frame.area();
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(1)])
        .split(area);

    draw_stack(frame, chunks[0], app);

    let footer = Paragraph::new(footer_text(app))
        .style(theme::dim_text())
        .alignment(Alignment::Center);
    frame.render_widget(footer, chunks[1]);
}

/// Centre the firelight, the cover plate, and the inscription as one vertical
/// stack inside `area`.
fn draw_stack(frame: &mut Frame<'_>, area: Rect, app: &App) {
    let flame_lines = flame::frame_lines(&app.fire);
    let flame_h = flame_lines.len() as u16;
    let plate_h = COVER_PLATE.len() as u16;
    // flame · gap · plate · gap · inscription(2)
    let stack_h = flame_h + 1 + plate_h + 1 + 2;
    let top_pad = area.height.saturating_sub(stack_h) / 2;

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(top_pad),
            Constraint::Length(flame_h),
            Constraint::Length(1),
            Constraint::Length(plate_h),
            Constraint::Length(1),
            Constraint::Length(2),
            Constraint::Min(0),
        ])
        .split(area);

    frame.render_widget(
        Paragraph::new(flame_lines).alignment(Alignment::Center),
        rows[1],
    );

    let plate: Vec<Line> = COVER_PLATE
        .iter()
        .map(|l| Line::from(Span::styled((*l).to_string(), theme::header())))
        .collect();
    frame.render_widget(
        Paragraph::new(plate).alignment(Alignment::Center),
        rows[3],
    );

    frame.render_widget(
        Paragraph::new(inscription(app)).alignment(Alignment::Center),
        rows[5],
    );
}

fn inscription(app: &App) -> Text<'static> {
    let r = &app.registries;
    Text::from(vec![
        Line::from(Span::styled(
            format!(
                "{} spells · {} companions · {} fellowships · {} tomes",
                r.skills.total(),
                r.agents.total(),
                r.teams.total(),
                r.guides.total(),
            ),
            theme::body(),
        )),
        Line::from(Span::styled("inscribed within", theme::dim_text())),
    ])
}

fn footer_text(app: &App) -> String {
    let breath = if app.fire.animate() { " · the fire breathes" } else { "" };
    format!("press any key to open the book   ·   [q] leave the fire{breath}")
}

pub fn handle_key(app: &mut App, _code: KeyCode, _mods: KeyModifiers) {
    // Any key not caught by the global handler (q / Ctrl-C / Tab) opens the book.
    // (The flare + redraw is handled by `App::touched`.)
    app.screen = Screen::Spellbook;
}

//! Firelight glyph — the half-block flame that lights the grimoire.
//!
//! Two hand-authored 14×10-pixel frames, cycled on the fire's tick counter and
//! tinted by the fire's `intensity` so a flare reads brighter than the resting
//! glow. (Real PNG frames from the viz pipeline land in a later increment; the
//! decode path is intentionally kept behind `frame_lines`.)

use ratatui::style::Color;
use ratatui::text::Line;

use super::halfblock::{render, Pixel, PixelGrid};
use crate::fire::FireState;
use crate::theme;

const FRAME_W: usize = 14;
const FRAME_H: usize = 10;
/// Ticks each frame is held before advancing to the next.
const FRAME_HOLD: u64 = 6;

const FRAME_A: &[&str] = &[
    "      .       ",
    "     ###      ",
    "    #####     ",
    "   #######    ",
    "  ###OOO###   ",
    "  ##OOoOO##   ",
    "  #OOoooOO#   ",
    "   ##oeo##    ",
    "    #eeee#    ",
    "    .eeee.    ",
];

const FRAME_B: &[&str] = &[
    "       .      ",
    "     ###      ",
    "    ## ##     ",
    "   ##OOO##    ",
    "  ##OOOOO##   ",
    "  #OOoooOO#   ",
    "   #OoooO#    ",
    "    #ooe#     ",
    "    #eeee#    ",
    "    eeeeee    ",
];

/// Render the flame for the current fire state, tinted by intensity.
pub fn frame_lines(fire: &FireState) -> Vec<Line<'static>> {
    let frames = [FRAME_A, FRAME_B];
    let frame = frames[(fire.tick() / FRAME_HOLD) as usize % frames.len()];
    let brightness = brightness_for(fire.intensity());
    let grid = decode(frame, brightness);
    render(&grid, Color::Reset)
}

/// Map fire intensity (`~0.45..=1.0`) to a per-channel brightness multiplier.
/// The resting glow sits slightly below the palette's nominal colour; a full
/// flare pushes it brighter (clamped per channel inside [`scale`]).
fn brightness_for(intensity: f32) -> f32 {
    (0.55 + intensity * 0.75).clamp(0.55, 1.4)
}

fn decode(art: &[&str], brightness: f32) -> PixelGrid {
    let mut grid: PixelGrid = Vec::with_capacity(FRAME_H);
    for row in art {
        let mut line: Vec<Pixel> = Vec::with_capacity(FRAME_W);
        for (i, ch) in row.chars().enumerate() {
            if i >= FRAME_W {
                break;
            }
            line.push(Pixel(color_for(ch).map(|c| scale(c, brightness))));
        }
        while line.len() < FRAME_W {
            line.push(Pixel(None));
        }
        grid.push(line);
    }
    grid
}

fn color_for(ch: char) -> Option<Color> {
    match ch {
        '#' => Some(theme::FLAME_MID),
        'O' => Some(theme::FLAME_HOT),
        'o' => Some(theme::FLAME_CORE),
        'e' => Some(theme::EMBER),
        '.' => Some(theme::FLAME_MID),
        _ => None,
    }
}

/// Multiply an RGB colour by a brightness factor, clamping per channel.
/// Non-RGB colours pass through unchanged.
fn scale(color: Color, factor: f32) -> Color {
    match color {
        Color::Rgb(r, g, b) => {
            let s = |v: u8| ((v as f32) * factor).round().clamp(0.0, 255.0) as u8;
            Color::Rgb(s(r), s(g), s(b))
        }
        other => other,
    }
}

# Lumen Stadium (seat-booking demo)

A demo site: fly into a stadium, pick a stand, a block and a seat, see the pitch from it, and "book" it.
The tournament (Meridian Cup, The Final 2034), the stadium, the prices and the seat numbers are invented. Nothing is booked.

Open it: start `all-sites` and go to http://localhost:5205/ (the Higgsfield guide is at `/guide.html`), or open `index.html` through any local web server.

## How it works

Seven full-screen views replace each other: the sky, the pitch from above (four stands), one stand (three tiers of six blocks),
one block (its seats), the view from the seat with a ticket, the VIP box (ten armchairs), and "Booked".
Two clips are used when their files are there: `intro.mp4` (flying towards the stadium; `intro-back.mp4` is the same clip reversed,
for "Booked") and `view-upper.mp4`, a short loop of the match that plays over the view from an upper seat (`view-lower.mp4` and
`view-vip.mp4` work the same way). Every move between views is a zoom into the place that was clicked, so the site works with pictures alone.
A first try at a clip from one aerial picture to another failed (the model bent one into the other, with a stadium inside a stadium),
which is why the opening picture is now the same view as the next one from further back.

## Files

- `config.js`: every word, price and position. `app.js`: the page. `styles.css`. `guide.html`: the prompts (written by `tools/lumen/make_guide.py`).
- `assets/stadium/`: nine pictures (`sky`, `bowl`, `stand`, `block-upper`, `block-lower`, `view-upper`, `view-lower`, `vip`, `view-vip`)
  and the clips. A missing picture shows as a slot that names its file.

## Good to know

- The pictures and clips were made by hand in Higgsfield, following `guide.html`: nine pictures and two clips.
  The clips came at 1276 x 712 and were enlarged frame by frame with Real-ESRGAN to 1920 wide.
- The positions in `config.js` (stands, tiers, every block's seats, the armchairs) are set on these pictures.
  `?place` at the end of the address shows the position of every click, for when a picture is replaced.
- All four stands open the same stand picture, and every block of a tier the same block picture.
- The fly-in and fly-out play a little faster than they were made (`clipSpeed` in `config.js`).
- It is made for a laptop first. On a phone the pictures are cropped at the sides.

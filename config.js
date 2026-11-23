// Lumen Stadium: everything the site says, and where things are on each picture.
// The tournament, the stadium, the prices and the numbers of seats are invented for the demo.
//
// Pictures and clips go in assets/stadium (guide.html lists them). Until a picture is there, its screen shows which file it is waiting for.
// Positions are in percent of the picture they sit on. To read a position, open the site with ?place at the end of the address
// and click on a picture: the numbers appear in the corner. The positions below are first guesses, to be set once the pictures exist.
window.LUMEN = {
  cup: "Meridian Cup",
  event: "The Final 2034",
  stadium: "Lumen Stadium",
  money: "€",

  intro: {
    eyebrow: "Meridian Cup · The Final 2034",
    title: "Choose your seat.",
    text: "Fly into Lumen Stadium, pick a stand, a block and a seat, and see the pitch from it before you book.",
    button: "Enter the stadium",
    picture: "sky",
  },

  steps: { stand: "Choose your stand", block: "pick your block", seat: "pick your seat", of: "Step", vip: "Pick your VIP seat" },
  words: {
    from: "from", left: "left", taken: "Taken", free: "Free", row: "Row", seat: "Seat", block: "Block", box: "VIP Box",
    yourSeat: "Your seat", pick: "Pick a seat", total: "Total", another: "Not satisfied? Another seat", goVip: "Want more? Go VIP",
    confirm: "Confirm", booked: "Booked", again: "Choose other seats", back: "Back", category: "Category", vipCat: "VIP · Hospitality",
    waiting: "Add this picture to assets/stadium:", demo: "Demo site. The tournament, stadium and prices are invented, and the pictures are computer-generated. Nothing is booked.",
  },

  // price categories: name, price, colour of its tint
  categories: {
    1: { price: 530, color: "#ff7a3d" },
    2: { price: 445, color: "#b06bff" },
    3: { price: 295, color: "#ff4d6a" },
    4: { price: 220, color: "#ffd84a" },
    vip: { price: 950, color: "#f1c45b" },
  },

  // 1. the stadium from above, at an angle (picture "bowl"): the four sides. The near stand is under the roof,
  // so its area is the strip of crowd below the pitch.
  bowl: {
    picture: "bowl",
    stands: [
      { id: "east", name: "East Stand", area: [[23, 23], [36, 18], [64, 18], [78, 24], [73, 36], [67, 39.5], [33, 39.5], [27, 34]] },
      { id: "west", name: "West Stand", area: [[20, 63], [28, 64.5], [72, 64.5], [80, 63], [78, 72], [62, 77], [38, 77], [22, 72]] },
      { id: "north", name: "North End", area: [[22, 35], [32, 40], [28.5, 62], [19, 62], [17, 55], [18, 45]] },
      { id: "south", name: "South End", area: [[78, 35], [68, 40], [71.5, 62], [81, 62], [83, 55], [82, 45]] },
    ],
  },

  // 2. one stand from the pitch (picture "stand"): three tiers. `edges` are the stairways that divide a tier into blocks,
  // left to right; top and bottom are where the tier's seats begin and end. All in percent of the picture.
  stand: {
    picture: "stand",
    tiers: [
      { id: "upper", first: 301, top: 31.5, bottom: 49.5, edges: [3.5, 14, 24.5, 35, 45, 55.5, 66, 76, 86.5, 97], cats: [4, 4, 3, 3, 3, 3, 3, 4, 4] },
      { id: "vip", first: 1, top: 50.5, bottom: 60.5, edges: [10.5, 25, 39.5, 53.5, 68, 82.5, 96.5], cats: ["vip", "vip", "vip", "vip", "vip", "vip"] },
      { id: "lower", first: 101, top: 64.5, bottom: 86.5, edges: [0.5, 10, 21.5, 33, 44, 56, 68, 80, 91, 99.5], cats: [2, 2, 1, 1, 1, 1, 1, 2, 2] },
    ],
  },

  // 3. one block, close (pictures "block-upper" and "block-lower"). A picture shows the block and its two neighbours, so the seats
  // come in sections. For each: `corners` are the centres of the end seats of its top row and its bottom row (top left, top right,
  // bottom right, bottom left); `rows`; `grow` is how much bigger each row's step is than the one above (rows nearer the camera are
  // further apart); `pitch` is the width of one seat in the top row and in the bottom row, so each row holds as many seats as fit.
  // `fans` is the part of a section where the picture shows people (from the left, from the top, to the right, to the bottom, as
  // shares of the section): those seats are taken. A section without `fans` has its taken seats scattered.
  // All in percent of the picture. To check them, tools/lumen/seatcheck.py draws the same grid on the picture.
  blocks: {
    // the side sections run out of the picture at the bottom, so their corners lie outside it; seats outside the picture are left out
    upper: { picture: "block-upper", view: "view-upper", clip: null, firstRow: 15, sections: [
      { corners: [[1.0, 31.3], [28.8, 31.3], [21.3, 90.3], [-13.0, 90.3]], rows: 16, grow: 1.017, pitch: [1.71, 2.26], fans: [0, 0, 0, 0] },
      { corners: [[35.7, 31.3], [64.7, 31.3], [69.4, 90.3], [31.0, 90.3]], rows: 16, grow: 1.017, pitch: [1.71, 2.26], fans: [0, 0.17, 1, 0.71] },
      { corners: [[71.4, 31.3], [99.0, 31.3], [113.0, 90.3], [78.7, 90.3]], rows: 16, grow: 1.017, pitch: [1.71, 2.26], fans: [0, 0, 0, 0] },
    ] },
    lower: { picture: "block-lower", view: "view-lower", clip: null, firstRow: 1, sections: [
      { corners: [[-1.1, 36.3], [29.3, 36.3], [24.0, 77.0], [-15.5, 77.0]], rows: 16, grow: 1.033, pitch: [1.6, 2.08], fans: [0, 0, 0, 0] },
      { corners: [[35.8, 36.3], [64.6, 36.3], [69.0, 77.0], [31.5, 77.0]], rows: 16, grow: 1.033, pitch: [1.6, 2.08], fans: [0, 0.13, 1, 0.87] },
      { corners: [[70.6, 36.3], [101.0, 36.3], [116.0, 77.0], [76.5, 77.0]], rows: 16, grow: 1.033, pitch: [1.6, 2.08], fans: [0, 0, 0, 0] },
    ] },
  },
  clipSpeed: 1.25,         // how fast the fly-in and fly-out clips play (1 is as made)
  takenShare: 0.64,        // about two seats in three are taken

  // the VIP box (picture "vip"): the ten armchairs of its front row, left to right
  vip: {
    picture: "vip", view: "view-vip",
    chairs: [
      { row: "A", x: 14.3, y: 50.5 }, { row: "A", x: 21.7, y: 50.5 }, { row: "A", x: 29.2, y: 50.5 }, { row: "A", x: 36.8, y: 50.5 }, { row: "A", x: 44.2, y: 50.5 },
      { row: "A", x: 57, y: 50.5 }, { row: "A", x: 64.5, y: 50.5 }, { row: "A", x: 72, y: 50.5 }, { row: "A", x: 79.5, y: 50.5 }, { row: "A", x: 87, y: 50.5 },
    ],
    taken: [1, 6],         // chairs already taken, counted from 0
  },
};

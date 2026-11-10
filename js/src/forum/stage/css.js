/* Stage styles, injected by the stage script so normal days carry none of it. */
export default `
/* ---------- the celebration stage: a centrepiece rises from the bottom ---------- */
.FanfareStage .Stack { display: flex; }
.FanfareStage .Stack .Avatar { --s: 24px; margin-left: -7px; box-shadow: 0 0 0 2px #fff4e4; }
.FanfareStage .Stack .Avatar:first-child { margin-left: 0; }
.FanfareStage .Play { position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 999px;
  font-weight: 700; color: var(--occ-btn-ink, #fff); background: var(--occ-btn, var(--primary-color));
  box-shadow: 0 8px 18px -8px rgba(0,0,0,.55); white-space: nowrap; }
.FanfareStage .Play .prog { position: absolute; left: 0; bottom: 0; height: 3px; background: currentColor; opacity: .6; width: 0; }
.FanfareStage .Play .eq { display: none; gap: 2px; align-items: flex-end; height: 14px; }
.FanfareStage .Play.playing .eq { display: inline-flex; }
.FanfareStage .Play.playing .note { display: none; }
.FanfareStage .Play .eq i { width: 3px; background: currentColor; border-radius: 2px; animation: ff-eq .9s ease-in-out infinite; }
.FanfareStage .Play .eq i:nth-child(2) { animation-delay: -.3s; } .FanfareStage .Play .eq i:nth-child(3) { animation-delay: -.6s; }
@keyframes ff-eq { 0%,100% { height: 4px; } 50% { height: 14px; } }
.FanfareStage .Play[disabled] { opacity: .6; cursor: default; }

.FanfareStage { position: fixed; inset: 0px 0 0; z-index: 1001; display: none; overflow: hidden; }
.FanfareStage.show { display: block; }
.FanfareStage .Stage-back { position: absolute; inset: 0; opacity: 0; transition: opacity .6s;
  background: radial-gradient(ellipse 75% 65% at 50% 100%, var(--spot) 0, transparent 72%), rgba(10,12,24,.5); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
[data-theme^="dark"] .FanfareStage .Stage-back { background: radial-gradient(ellipse 75% 65% at 50% 100%, var(--spot) 0, transparent 72%), rgba(0,0,0,.66); }
.FanfareStage.up .Stage-back { opacity: 1; }
.FanfareStage .Skip { position: absolute; top: 14px; right: 14px; z-index: 3; display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 16px;
  border-radius: 999px; border: 1px solid rgba(255,255,255,.35); background: rgba(255,255,255,.16); color: #fff; font-weight: 600;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); opacity: 0; transition: opacity .4s .3s; }
.FanfareStage .Skip:hover { background: rgba(255,255,255,.28); }
.FanfareStage.up .Skip { opacity: 1; }
.FanfareStage .Piece { position: absolute; left: 50%; bottom: var(--ff-bottom, 0px); aspect-ratio: 600 / 700; container-type: inline-size;
  width: min(600px, 94vw, calc((100dvh - 30px - var(--ff-bottom, 0px)) * .857));
  transform: translate(-50%, 108%); transition: transform 1.2s cubic-bezier(.28,1.32,.5,1); }
.FanfareStage.up .Piece { transform: translate(-50%, 0); }
.FanfareStage.leaving .Piece { transition: transform .7s cubic-bezier(.55,0,.8,.2); transform: translate(-50%, 110%); }
.FanfareStage.leaving .Stage-back { opacity: 0; }
.FanfareStage .Piece > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 20px 30px rgba(0,0,0,.35)); }
.FanfareStage .Piece-title, .FanfareStage .Piece-foot { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  opacity: 0; transform: translateY(6px); transition: opacity .5s 1s, transform .5s 1s; }
.FanfareStage.up .Piece-title, .FanfareStage.up .Piece-foot { opacity: 1; transform: none; }
.FanfareStage .Piece-foot { pointer-events: auto; }
.FanfareStage .Script { font-family: Pacifico, "Brush Script MT", cursive; font-weight: 400; line-height: 1.12; margin: 0; letter-spacing: .2px; }
.FanfareStage .Script:focus { outline: none; }
.FanfareStage .Sub { font-size: max(12px, 2.35cqw); font-weight: 600; line-height: 1.35; margin: 0 0 max(8px, 1.5cqw); }
.FanfareStage .Acts { display: flex; gap: max(6px, 1.2cqw); flex-wrap: wrap; justify-content: center; }
.FanfareStage .Piece .Play, .FanfareStage .PSoft { min-height: max(40px, 7.4cqw); font-size: max(13.5px, 2.6cqw); padding: 0 max(14px, 3cqw); }
.FanfareStage .PSoft, .FanfareStage .PRound { border: 0; border-radius: 999px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  background: rgba(255,255,255,.94); color: var(--occ-ink); box-shadow: 0 8px 18px -8px rgba(0,0,0,.45); white-space: nowrap; }
.FanfareStage .PRound { width: max(40px, 7.4cqw); height: max(40px, 7.4cqw); font-size: max(14px, 2.6cqw); flex: none; }
.FanfareStage .PSoft:hover, .FanfareStage .PRound:hover { background: #fff; }
.FanfareStage.occ-newyear .PSoft, .FanfareStage.occ-newyear .PRound { background: rgba(255,255,255,.13); color: #fff; box-shadow: inset 0 0 0 1px rgba(255,255,255,.28); }

/* birthday */
.FanfareStage .t-bday { color: #fff; font-size: max(27px, 8.6cqw); text-shadow: 0 .5cqw 0 #c9487b, 0 1.1cqw 2cqw rgba(140,20,70,.35); }
.FanfareStage .t-bday { line-height: 1.22; }
.FanfareStage .t-bday small { display: block; font-size: .7em; line-height: 1.3; margin-bottom: .3em; }
.FanfareStage .sub-bday { color: #7a3f2a; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
/* christmas */
.FanfareStage .t-xmas { color: #fff; font-size: max(25px, 6.9cqw); text-shadow: 0 .45cqw 0 #6e111b, 0 0 2.2cqw rgba(255,214,110,.45); }
.FanfareStage .sub-xmas { color: #ffe9b0; }
/* new year */
.FanfareStage .Dial, .FanfareStage .Dial-after { display: flex; flex-direction: column; align-items: center; }
.FanfareStage .Dial-after { display: none; }
.FanfareStage.midnight .Dial { display: none; } .midnight .Dial-after { display: flex; animation: ff-pop .6s cubic-bezier(.3,1.6,.5,1); }
@keyframes ff-pop { from { transform: scale(.6); opacity: 0; } }
.FanfareStage .Dial .pre, .FanfareStage .Dial .tz { font-size: max(10.5px, 1.9cqw); letter-spacing: .16em; text-transform: uppercase; color: #aab3e0; font-weight: 700; }
.FanfareStage .Dial .tz { letter-spacing: .04em; text-transform: none; font-weight: 500; margin-top: .6cqw; }
.FanfareStage .Dial .digits.long { font-size: max(30px, 9.5cqw); }
.FanfareStage .Dial .digits { font: 700 max(44px, 14cqw)/1.05 ui-monospace, SFMono-Regular, Menlo, monospace; color: #ffe08a; text-shadow: 0 0 2.4cqw rgba(255,200,80,.6); }
.FanfareStage .t-nye { white-space: nowrap; line-height: 1.35; font-size: max(24px, 6.6cqw); background: linear-gradient(90deg, #ffe9a8, #ffb347 50%, #ffe9a8); -webkit-background-clip: text; background-clip: text; color: transparent; padding: 0 .1em; filter: drop-shadow(0 0 8px rgba(255,190,80,.45)); }
.FanfareStage .Dial-after .yr { color: #e6e9ff; font-weight: 700; font-size: max(13px, 2.8cqw); letter-spacing: .08em; }
.FanfareStage .sub-nye { color: #d6dbff; }
/* diwali */
.FanfareStage .t-diwali { color: #c2410c; font-size: max(25px, 7cqw); text-shadow: 0 .35cqw 0 #ffd8a8; }
.FanfareStage .sub-diwali { color: #6b2a14; margin-top: .8cqw; }

/* membership anniversary */
.FanfareStage .yrs { font: 800 max(64px, 21cqw)/1 Georgia, "Times New Roman", serif; background: linear-gradient(180deg, #fff2bd, #e9b949 60%, #b8862a); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 .6cqw 0 rgba(0,0,0,.35)); margin-top: 2cqw; }
.FanfareStage .yrsl { max-width: 100%; overflow-wrap: anywhere; text-align: center; color: #dfe7f6; font-weight: 700; font-size: max(11px, 2.2cqw); letter-spacing: .16em; text-transform: uppercase; margin-top: .6cqw; }
.FanfareStage .t-anniv { color: #2d4a7a; font-size: max(19px, 5.2cqw); line-height: 1.3; }
.FanfareStage .t-anniv.long { font-size: max(17px, 4.2cqw); }
.FanfareStage .sub-anniv { color: #5b6b82; font-weight: 600; margin-top: .2cqw; }
/* lamps: candles, diyas */
.FanfareStage .Lamp .Flame { transform-box: view-box; opacity: 0; transform: scale(.15); transition: opacity .25s, transform .4s cubic-bezier(.3,1.7,.5,1); }
.FanfareStage .Lamp.lit .Flame { opacity: 1; transform: none; }
.FanfareStage .Fl { transform-box: view-box; animation: ff-flick .15s ease-in-out infinite alternate; }
@keyframes ff-flick { from { transform: scale(1, 1) skewX(-3deg); } to { transform: scale(.9, 1.09) skewX(3.5deg); } }
.FanfareStage .Glow { animation: ff-glowp 1.1s ease-in-out infinite alternate; }
@keyframes ff-glowp { from { opacity: .65; } to { opacity: 1; } }
.FanfareStage .Candle { cursor: pointer; }
.FanfareStage .Puff { transform-box: fill-box; transform-origin: center; fill: rgba(205,205,215,.8); animation: ff-puff 1.7s ease-out forwards; }
@keyframes ff-puff { from { opacity: .8; transform: translate(0, 0) scale(.5); } to { opacity: 0; transform: translate(var(--dx), -95px) scale(2.8); } }
/* tree lights */
.FanfareStage .Bulb .bc { fill: #2d4636; transition: fill .3s; }
.FanfareStage .Bulb .bh { fill: var(--c); opacity: 0; transition: opacity .4s; }
.FanfareStage .String.lit .bc { fill: var(--c); }
.FanfareStage .String.lit .bh { opacity: .6; animation: ff-tw2 1.3s var(--d) ease-in-out infinite alternate; }
@keyframes ff-tw2 { to { opacity: .2; } }
.FanfareStage .Star .bright, .FanfareStage .Star .halo { opacity: 0; transition: opacity .6s; }
.FanfareStage .Star.lit .bright, .FanfareStage .Star.lit .halo { opacity: 1; }
.FanfareStage .Star .rays { transform-box: view-box; transform-origin: 300px 62px; }
.FanfareStage .Star.lit .rays { animation: ff-spin 18s linear infinite; }
@keyframes ff-spin { to { transform: rotate(360deg); } }
/* clock */
.FanfareStage .Hand { transform-box: view-box; transform-origin: 300px 262px; transition: transform .35s cubic-bezier(.4,2.2,.6,1); }
.FanfareStage .Halo { opacity: 0; }
.FanfareStage.midnight .Halo { animation: ff-halo 1.4s ease-in-out infinite alternate; }
@keyframes ff-halo { from { opacity: .25; } to { opacity: .95; } }
/* rangoli */
.FanfareStage .Ring { transform-box: view-box; transform-origin: 300px 262px; opacity: 0; transform: scale(.3) rotate(-70deg);
  transition: transform 1.3s cubic-bezier(.2,1.15,.4,1) var(--d), opacity .7s var(--d); }
.FanfareStage.up .Ring { opacity: 1; transform: none; }
.FanfareStage.up .Ring .spin { transform-box: view-box; transform-origin: 300px 262px; animation: ff-spin 90s linear infinite; }
.FanfareStage.instant *, .FanfareStage.instant { transition: none !important; }
/* Christmas present + tag */
.FanfareStage .Gift { cursor: pointer; }
.FanfareStage .Lid { transform-box: view-box; transform-origin: 300px 250px; transition: transform .95s cubic-bezier(.25,1.25,.5,1), opacity .5s .45s; }
.FanfareStage.opened .Lid { transform: translate(80px, -360px) rotate(26deg); opacity: 0; }
.FanfareStage .Beam { opacity: 0; transition: opacity .6s .15s; }
.FanfareStage.opened .Beam { opacity: 1; }
.FanfareStage .TagPivot { position: absolute; left: 50.5%; top: 33%; width: 0; height: 0; transition: transform .95s cubic-bezier(.25,1.25,.5,1), opacity .5s .45s; }
.FanfareStage.opened .TagPivot { transform: translate(13cqw, -60cqw) rotate(26deg); opacity: 0; }
.FanfareStage .TagSwing { position: absolute; left: 0; top: 0; transform-origin: 0 0; animation: ff-swing 3.2s ease-in-out infinite alternate; filter: drop-shadow(0 1.2cqw 1.4cqw rgba(0,0,0,.35)); }
@keyframes ff-swing { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
.FanfareStage .TagString { position: absolute; left: -1px; top: 0; width: 2px; height: 29cqw; background: linear-gradient(#f0dcae, #b9925a); transform-origin: top; transform: rotate(-6deg); }
.FanfareStage .Tag { position: absolute; left: -48cqw; top: 21cqw; width: 54cqw; padding: 2.4cqw 9cqw 2.4cqw 3.4cqw; transform: rotate(-7deg); transform-origin: right top;
  display: flex; flex-direction: column; align-items: flex-start; text-align: left;
  background: linear-gradient(160deg, #fdf4df, #efd8a9); clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%); color: #5a3a1a; }
.FanfareStage .Tag::before { content: ""; position: absolute; inset: 1.1cqw 4cqw 1.1cqw 1.1cqw; border: 2px dashed rgba(150,100,50,.35); border-radius: 4px; pointer-events: none; }
.FanfareStage .Tag .hole { position: absolute; right: 6.4cqw; top: 50%; width: 2.8cqw; height: 2.8cqw; margin-top: -1.4cqw; border-radius: 50%; background: radial-gradient(#3b2a1a 42%, #d9b77a 46%, #c9a05f 70%); }
.FanfareStage .Tag .to, .FanfareStage .Tag .from { font-weight: 700; font-size: max(11px, 2.3cqw); letter-spacing: .04em; color: #8a5a2b; }
.FanfareStage .Tag .mc { font-family: Pacifico, cursive; font-weight: 400; font-size: max(19px, 5.4cqw); color: #b3121f; line-height: 1.3; margin: 0; }
.FanfareStage .Tag .mc:focus { outline: none; }
.FanfareStage .TopDeco { position: absolute; left: 0; right: 0; top: 0; z-index: 2; pointer-events: none; transform: translateY(-110%); transition: transform 1s cubic-bezier(.3,1.4,.5,1) .25s; }
.FanfareStage .TopDeco svg { display: block; }
.FanfareStage.up .TopDeco { transform: none; }
.FanfareStage .TopDeco .bg { opacity: .2; } .TopDeco .bb { opacity: .7; }
.FanfareStage.up .TopDeco .bg { animation: ff-chase 1.8s ease-in-out infinite var(--d); }
.FanfareStage.up .TopDeco .bb { animation: ff-chase2 1.8s ease-in-out infinite var(--d); }
@keyframes ff-chase { 0%, 100% { opacity: .15; } 50% { opacity: .95; } }
@keyframes ff-chase2 { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
.FanfareStage .TopDeco .flag { transform-box: fill-box; transform-origin: top center; animation: ff-flutter 2.4s ease-in-out infinite alternate var(--d); }
@keyframes ff-flutter { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
.FanfareStage.from-top .Piece { bottom: auto; top: 0; transform: translate(-50%, -110%); }
.FanfareStage.from-top.up .Piece { transform: translate(-50%, 0); }
.FanfareStage.from-top.leaving .Piece { transform: translate(-50%, -112%); }
.FanfareStage .Lamp.noscale .Flame { transform: none; }
.FanfareStage .flick { animation: ff-pflick .12s ease-in-out infinite alternate; }
@keyframes ff-pflick { from { opacity: .82; } to { opacity: 1; } }
.FanfareStage .Cracker { transition: opacity .15s; }
.FanfareStage .Cracker.popped { opacity: 0; }
.FanfareStage .twk { transform-box: fill-box; transform-origin: center; animation: ff-twk 1.8s ease-in-out infinite; }
@keyframes ff-twk { 50% { opacity: .25; transform: scale(.6); } }
.FanfareStage .Bat { transform-box: view-box; transform-origin: 300px 330px; transform: translate(calc(300px + var(--tx)), calc(330px + var(--ty))) scale(var(--s)); opacity: 0; }
.FanfareStage.up .Bat { opacity: 1; animation: ff-batOut 2.4s cubic-bezier(.2,.7,.3,1) 1.6s backwards; }
@keyframes ff-batOut { from { transform: translate(300px, 340px) scale(.2); opacity: 0; } }
.FanfareStage .Bat .wing { transform-box: fill-box; transform-origin: center; animation: ff-flap .2s ease-in-out infinite alternate; }
@keyframes ff-flap { to { transform: scaleY(.6) translateY(2px); } }
.FanfareStage .Bob { animation: ff-bob 3s ease-in-out infinite alternate; }
@keyframes ff-bob { to { transform: translateY(-10px); } }
.FanfareStage .t-light { color: #fff; line-height: 1.4; font-size: max(28px, 8cqw); text-shadow: 0 0 2.4cqw rgba(140,180,255,.8), 0 .4cqw 0 #2a55b0; }
.FanfareStage .sub-light { color: #dbe7ff; margin-top: 1.6cqw; }
.FanfareStage .cn { font-size: max(26px, 8.5cqw); font-weight: 800; color: #ffd56b; letter-spacing: .1em; text-shadow: 0 .5cqw 0 #7d0a14, 0 0 2cqw rgba(255,200,80,.5); line-height: 1.15; }
.FanfareStage .t-lunar { color: #fff3c4; font-size: max(17px, 4.6cqw); text-shadow: 0 .35cqw 0 #7d0a14; line-height: 1.4; }
.FanfareStage .yr2 { color: #ffe1a8; font-weight: 700; font-size: max(11px, 2.2cqw); letter-spacing: .08em; text-transform: uppercase; }
.FanfareStage .t-eid { color: #fff6d0; font-size: max(28px, 7.6cqw); text-shadow: 0 0 2.4cqw rgba(255,214,110,.7), 0 .4cqw 0 #6b4a10; }
.FanfareStage .sub-eid { color: #f6e7bf; }
.FanfareStage .t-hallo { font-family: Creepster, Pacifico, cursive; font-weight: 400; margin: 0; line-height: 1.05; font-size: max(40px, 12cqw); color: #ff8a1f; letter-spacing: .04em;
  text-shadow: 0 .5cqw 0 #3b1600, 0 0 3cqw rgba(255,140,0,.6); }
.FanfareStage .t-hallo:focus { outline: none; }
.FanfareStage .t-thanks { color: #9a3412; font-size: max(21px, 5.4cqw); text-shadow: 0 .3cqw 0 #ffe0b0; line-height: 1.35; }
.FanfareStage .sub-thanks { color: #6b2a14; }
.FanfareStage.calm .TopDeco, .FanfareStage.calm .Bat { animation: none !important; transition: none !important; }
.FanfareStage.midnight .Piece > svg { animation: ff-strike .7s ease-out; transform-origin: 50% 37%; }
@keyframes ff-strike { 30% { transform: scale(1.06); } }
.FanfareStage.calm *, .FanfareStage.calm .Stage-back { animation: none !important; transition: none !important; }

#FanfareFx { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1003; }
.FanfareStage { font-family: var(--font-family, inherit); -webkit-font-smoothing: antialiased; }
.FanfareStage button { font: inherit; cursor: pointer; }
.FanfareStage .Script, .FanfareStage .Tag .mc { font-family: Pacifico, "Brush Script MT", "Segoe Script", cursive; }
`;

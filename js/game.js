/* NEONDRIFT – Spiellogik. Siehe CLAUDE.md fuer Architektur. */
(() => {
  "use strict";
  const canvas=document.getElementById('c'), ctx=canvas.getContext('2d');
  const S={MENU:0,PLAY:1,UPGRADE:2,OVER:3,PAUSE:4};
  let state=S.MENU, mode='normal';
  let DPR=Math.min(window.devicePixelRatio||1,2), W=0, H=0, lastT=0;
  let frameMs=16, fxQ=1;   // Performance-Governor: geglättete Frame-Zeit + FX-Qualität (1=voll, sinkt automatisch bei Lag)

  // ---------- i18n (DE / EN / FR, Jugendsprache je Sprache) ----------
  function detectLang(){ const l=((navigator.language||navigator.userLanguage||'en')+'').slice(0,2).toLowerCase(); return (l==='de'||l==='fr')?l:'en'; }
  function loadLang(){ try{ const s=localStorage.getItem('neondrift_lang'); if(s==='de'||s==='en'||s==='fr') return s; }catch(e){} return detectLang(); }
  let lang=loadLang();
  function saveLang(){ try{ localStorage.setItem('neondrift_lang',lang); }catch(e){} }
  function t(k){ const o=TR[lang]||TR.en; return (o[k]!=null?o[k]:(TR.en[k]!=null?TR.en[k]:k)); }
  function P(k){ const o=TR[lang]||TR.en; return o[k]||TR.en[k]||[]; }   // lokalisierter Pool
  const TR={
    de:{
      tag:'weiche aus · sammle · überlebe', daily:'🗓 TÄGLICHE CHALLENGE', workshop:'WERKSTATT', settings:'⚙️ EINSTELLUNGEN',
      how:'Maus oder <b>Finger</b> · knapp vorbei = <b>Near-Miss-Bonus</b> · 🛡 sammeln · <b>ESC</b> = Menü', install:'📲 App installieren',
      ios:'Auf dem iPhone: <b>Teilen-Symbol</b> antippen → <b>„Zum Home-Bildschirm"</b> – dann läuft NEONDRIFT als Vollbild-App.',
      m_normal:'ARCADE', m_normalD:'Levels, neue Formen, Boss-Wellen, Upgrade-Karten & Power-Ups. Das volle Programm.',
      m_hard:'BLITZ', m_hardD:'Keine Orbs. Brutal schnell. Nur Mut, Near-Misses & Power-Ups retten dich.',
      m_zen:'ZEN', m_zenD:'Kein Tod. Treffer kostet nur Combo. Entspannt sammeln, Highscore jagen.',
      pause:'PAUSE', resume:'▶ WEITER', mainmenu:'☰ HAUPTMENÜ', chooseUp:'UPGRADE WÄHLEN', arsenal:'🔫 ARSENAL', level:'Level',
      newWeapon:'NEUE WAFFE', path:'PFAD', slotsLbl:'Slots', synTitle:'Synergien', noSyn:'— noch keine —', drop:'ablegen', lockedW:'🔒 Werkstatt', equipHint:'Tippen zum Aus-/Einrüsten', arsenalTitle:'🎒 ARSENAL', freeSlot:'frei', arsenalBtn:'🎒 ARSENAL', synUnlocked:'SYNERGIE!', legChosen:'gewählt', legAvail:'wählbar', legLocked:'gesperrt', forkLocked:'🔒 In der Werkstatt freischalten', blueprint:'Bauplan', startWeapon:'Startwaffe', forkTier:'Fork-Stufe', cat_weapons:'Waffen', cat_ship:'Schiff', cat_power:'Kräfte', cat_economy:'Ökonomie', cat_cosmetic:'Kosmetik', cat_synergy:'Synergien', treeHint:'Pfade wählst du beim Level-Up', addWeapon:'Waffe holen', skillPts:'Skillpunkte', skillHint:'💠 Tippe einen Knoten zum Freischalten', skillNext:'▶ WEITER', synOn:'aktiv', synNeed:'fehlt',
      balance:'Guthaben', shopHint:'dauerhaft gespeichert · immer teurer & krasser', back:'← ZURÜCK', reallyQ:'WIRKLICH? ✓ (tippen)', resetTitle:'DATEN ZURÜCKSETZEN', rs_workshop:'🛠️ Werkstatt (Upgrades + Chips)', rs_scores:'🏆 Highscores', rs_achskins:'🏅 Erfolge & Skins', rs_all:'⚠️ ALLES löschen', rsDone:'✓ ZURÜCKGESETZT',
      setTitle:'EINSTELLUNGEN', tapToggle:'Tippen zum Umschalten', optShake:'Screenshake', optFx:'Bildschirm-Effekte', optCurses:'🎲 Lustige Flüche', optGuns:'🔫 Schießen / Waffen', optDmg:'🔢 Schadenszahlen', optLang:'🌐 Sprache',
      on:'AN', off:'AUS', reduced:'REDUZIERT', activated:'aktiviert', loser:'LOSER', respec:'Skills zurücksetzen', reskilled:'zurückgenommen', crash:'CRASH', points:'Punkte', record:'Rekord', newRec:'★ NEUER REKORD ★', again:'NOCHMAL', share:'📤 TEILEN', menu:'MENÜ', best:'BEST',
      lvl:'LEVEL', newForm:'Neue Form: ', faster:'Schneller & dichter!', bossWave:'⚠ BOSS-WELLE ', megaBoss:'🛸 MEGA-BOSS', endgegner:'👾 DER ENDGEGNER', finaleSub:'überlebe das Inferno!',
      survived:'ÜBERLEBT!', defeated:'BESIEGT! 💥', escaped:'🛸 ENTKOMMEN…', escapedSub:'die Beute ist weg!', armUp:'Rüste auf für den Boss · Level ',
      overdrive:'⚡ OVERDRIVE', overdriveSub:'du brennst!', enrage:'🔥 ENRAGE!', enrageSub:'es dreht völlig durch!',
      beaten:'🏆 DURCHGESPIELT!', beatenSub:'…aber es hört nicht auf.', madness:'☣ WAHNSINN-MODUS', madnessSub:'wie weit kommst du?', clearedTag:'🏆 DURCHGESPIELT!  ·  ',
      shieldGone:'SCHILD WEG!', comboGoneZ:'COMBO WEG', lifeLost:'−1 ♥', livesLeft:' ♥ ÜBRIG', comboOut:'COMBO AUS', perfect:'PERFEKT! 🎯', daily2:'🗓 DAILY',
      pSchild:'SCHILD', pSlow:'SLOW-MO', pMagnet:'MAGNET', pDouble:'PUNKTE ✕2', pBomb:'BOMBE', boom:'BOOM!', boomSub:' pulverisiert', curseTag:'🎲 FLUCH',
      shareScore:' Punkte! Schlag mich 🔥 ', beatMe:'SCHLAG MICH. 🔥', pointsBig:'PUNKTE', dailyLbl:'TÄGLICH', modeDaily:'TÄGLICH',
      achBtn:'🏅 ERFOLGE', achTitle:'ERFOLGE', achGot:'🏅 ERFOLG', locked:'gesperrt', active:'AKTIV', choose:'WÄHLEN', customShip:'Eigenes Schiff', newShip:'Neues Schiff', del:'Löschen', shipDefault:'Schiff', design:'Entwerfen', edit:'Bearbeiten', pixels:'Pixel', templates:'Vorlagen', glowUnlock:'Glow freischalten',
      near:['KNAPP!','lowkey close','W ausweichen','ZACK!','fr fr','skill 🔥','HUI!'],
      combo:{3:'W COMBO',5:'GOATED 🐐',8:'SIGMA 🗿',12:'+1000 AURA',16:'GÖTTLICH fr',20:'NO CAP 🔥',24:'CYBER-GOD'},
      quips:["Dein Pixel-Ich ist jetzt Teil des Bodenbelags.","Tod durch Quadrat. Wie würdevoll.","Die gute Nachricht: Es tat nur einen Frame lang weh.","R.I.P. – Rendered In Pieces.","Selbst das Tutorial weint gerade.","Reflexe wie ein Faultier im Winterschlaf.","Glückwunsch! Du hast den Boden gefunden.","Die Synthwave-Götter schütteln den Kopf.","Du hattest EINE Aufgabe.","Statistisch gesehen: peinlich.","Organspende war gestern. Heute: Pixelspende.","Der Block kam aus dem Nichts. Dein Talent auch.","Game Over. Aber immerhin stilvoll explodiert."],
      insults:["Schwach. Richtig schwach.","Loser-Alarm. 🚨","Meine Oma weicht besser aus.","Git gud, sagt man da.","Setzen. Sechs.","skill issue tbh.","−1000 Aura, digga.","mid. einfach mid.","War das Absicht? Bitte sag ja.","0 rizz, 0 skill.","Selbst die Bots lachen.","NPC-Tod erkannt."],
      dumb:["bro hat einfach... ja.","das ist lowkey mid","real ones wissen Bescheid","kein Cap fr fr","gönn dir, digga","sigma move 🗿","valid. einfach valid.","slay 💅","based ngl","das ribbelt im Hirn","ist das Aura oder Lag?","kein Plan was hier abgeht","Hä? auch egal."],
      crazy:["weiche aus · sammle · überlebe","probier nicht zu sterben (du wirst)","100% chiptune, 0% gnade","heute schon explodiert?","no cap, das wird mid","reflexe verkauft? hier zurückholen"]
    },
    en:{
      tag:'dodge · collect · survive', daily:'🗓 DAILY CHALLENGE', workshop:'WORKSHOP', settings:'⚙️ SETTINGS',
      how:'Mouse or <b>finger</b> · barely dodge = <b>near-miss bonus</b> · grab 🛡 · <b>ESC</b> = menu', install:'📲 Install app',
      ios:'On iPhone: tap the <b>Share</b> icon → <b>"Add to Home Screen"</b> – then NEONDRIFT runs fullscreen.',
      m_normal:'ARCADE', m_normalD:'Levels, new shapes, boss waves, upgrade cards & power-ups. The full ride.',
      m_hard:'BLITZ', m_hardD:'No orbs. Brutally fast. Only guts, near-misses & power-ups save you.',
      m_zen:'ZEN', m_zenD:'No death. A hit only costs your combo. Chill, collect, chase the highscore.',
      pause:'PAUSE', resume:'▶ RESUME', mainmenu:'☰ MAIN MENU', chooseUp:'CHOOSE UPGRADE', arsenal:'🔫 ARSENAL', level:'Level',
      newWeapon:'NEW WEAPON', path:'PATH', slotsLbl:'Slots', synTitle:'Synergies', noSyn:'— none yet —', drop:'drop', lockedW:'🔒 Workshop', equipHint:'Tap to equip / unequip', arsenalTitle:'🎒 ARSENAL', freeSlot:'free', arsenalBtn:'🎒 ARSENAL', synUnlocked:'SYNERGY!', legChosen:'chosen', legAvail:'available', legLocked:'locked', forkLocked:'🔒 Unlock in the Workshop', blueprint:'Blueprint', startWeapon:'Starter weapon', forkTier:'Fork tier', cat_weapons:'Weapons', cat_ship:'Ship', cat_power:'Power', cat_economy:'Economy', cat_cosmetic:'Cosmetic', cat_synergy:'Synergies', treeHint:'Paths are chosen on level-up', addWeapon:'Get weapon', skillPts:'skill points', skillHint:'💠 Tap a node to unlock', skillNext:'▶ CONTINUE', synOn:'active', synNeed:'need',
      balance:'Balance', shopHint:'saved permanently · ever pricier & crazier', back:'← BACK', reallyQ:'SURE? ✓ (tap)', resetTitle:'RESET DATA', rs_workshop:'🛠️ Workshop (upgrades + chips)', rs_scores:'🏆 High scores', rs_achskins:'🏅 Achievements & skins', rs_all:'⚠️ DELETE EVERYTHING', rsDone:'✓ RESET',
      setTitle:'SETTINGS', tapToggle:'Tap to toggle', optShake:'Screenshake', optFx:'Screen effects', optCurses:'🎲 Funny curses', optGuns:'🔫 Shooting / weapons', optDmg:'🔢 Damage numbers', optLang:'🌐 Language',
      on:'ON', off:'OFF', reduced:'REDUCED', activated:'activated', loser:'LOSER', respec:'Reset skills', reskilled:'refunded', crash:'CRASH', points:'Score', record:'Best', newRec:'★ NEW RECORD ★', again:'AGAIN', share:'📤 SHARE', menu:'MENU', best:'BEST',
      lvl:'LEVEL', newForm:'New shape: ', faster:'Faster & denser!', bossWave:'⚠ BOSS WAVE ', megaBoss:'🛸 MEGA-BOSS', endgegner:'👾 THE FINAL BOSS', finaleSub:'survive the inferno!',
      survived:'SURVIVED!', defeated:'DEFEATED! 💥', escaped:'🛸 ESCAPED…', escapedSub:'the loot is gone!', armUp:'Gear up for the boss · Level ',
      overdrive:'⚡ OVERDRIVE', overdriveSub:"you're on fire!", enrage:'🔥 ENRAGE!', enrageSub:'it totally loses it!',
      beaten:'🏆 YOU BEAT IT!', beatenSub:'…but it never stops.', madness:'☣ MADNESS MODE', madnessSub:'how far can you go?', clearedTag:'🏆 BEATEN!  ·  ',
      shieldGone:'SHIELD GONE!', comboGoneZ:'COMBO LOST', lifeLost:'−1 ♥', livesLeft:' ♥ LEFT', comboOut:'COMBO OUT', perfect:'PERFECT! 🎯', daily2:'🗓 DAILY',
      pSchild:'SHIELD', pSlow:'SLOW-MO', pMagnet:'MAGNET', pDouble:'SCORE ✕2', pBomb:'BOMB', boom:'BOOM!', boomSub:' vaporized', curseTag:'🎲 CURSE',
      shareScore:' points! Beat me 🔥 ', beatMe:'BEAT ME. 🔥', pointsBig:'POINTS', dailyLbl:'DAILY', modeDaily:'DAILY',
      achBtn:'🏅 ACHIEVEMENTS', achTitle:'ACHIEVEMENTS', achGot:'🏅 ACHIEVEMENT', locked:'locked', active:'ACTIVE', choose:'SELECT', customShip:'Custom Ship', newShip:'New Ship', del:'Delete', shipDefault:'Ship', design:'Design', edit:'Edit', pixels:'Pixels', templates:'Templates', glowUnlock:'Unlock glow',
      near:['CLOSE!','lowkey close','clean dodge','ZOOM!','fr fr','skill 🔥','WHEW!'],
      combo:{3:'W COMBO',5:'GOATED 🐐',8:'SIGMA 🗿',12:'+1000 AURA',16:'GODLIKE fr',20:'NO CAP 🔥',24:'CYBER-GOD'},
      quips:["Your pixel self is now part of the flooring.","Death by square. How dignified.","Good news: it only hurt for one frame.","R.I.P. – Rendered In Pieces.","Even the tutorial is crying.","Reflexes like a sloth on melatonin.","Congrats! You found the floor.","The synthwave gods shake their heads.","You had ONE job.","Statistically speaking: embarrassing."],
      insults:["Weak. Real weak.","Loser alert. 🚨","My grandma dodges better.","Git gud, they say.","Sit down. Zero.","skill issue tbh.","−1000 aura, bro.","mid. just mid.","sit down, bro.","0 rizz, 0 skill.","ratio. L. cope.","NPC death detected."],
      dumb:["bro just... yeah.","this is lowkey mid","real ones know","no cap fr fr","treat yourself, bro","sigma move 🗿","valid. just valid.","slay 💅","based ngl","that's brain-tingling","aura or just lag?","no clue what's happening","huh? whatever."],
      crazy:["dodge · collect · survive","try not to die (you will)","100% chiptune, 0% mercy","exploded yet today?","no cap, this'll be mid","sold your reflexes? get 'em back here"]
    },
    fr:{
      tag:'esquive · collecte · survis', daily:'🗓 DÉFI DU JOUR', workshop:'ATELIER', settings:'⚙️ RÉGLAGES',
      how:'Souris ou <b>doigt</b> · frôler = <b>bonus near-miss</b> · choper 🛡 · <b>ESC</b> = menu', install:'📲 Installer l’appli',
      ios:'Sur iPhone : touche l’icône <b>Partager</b> → <b>« Sur l’écran d’accueil »</b> – NEONDRIFT passe en plein écran.',
      m_normal:'ARCADE', m_normalD:'Niveaux, nouvelles formes, vagues de boss, cartes d’amélioration & power-ups. Le pack complet.',
      m_hard:'BLITZ', m_hardD:'Pas d’orbes. Ultra rapide. Seuls le cran, les near-miss & power-ups te sauvent.',
      m_zen:'ZEN', m_zenD:'Pas de mort. Un coup coûte juste ton combo. Chill, collecte, vise le highscore.',
      pause:'PAUSE', resume:'▶ REPRENDRE', mainmenu:'☰ MENU', chooseUp:'CHOISIS UNE AMÉLIORATION', arsenal:'🔫 ARSENAL', level:'Niveau',
      newWeapon:'NOUVELLE ARME', path:'VOIE', slotsLbl:'Slots', synTitle:'Synergies', noSyn:'— aucune —', drop:'retirer', lockedW:'🔒 Atelier', equipHint:'Touchez pour équiper/retirer', arsenalTitle:'🎒 ARSENAL', freeSlot:'libre', arsenalBtn:'🎒 ARSENAL', synUnlocked:'SYNERGIE !', legChosen:'choisi', legAvail:'disponible', legLocked:'verrouillé', forkLocked:'🔒 Débloquer à l’Atelier', blueprint:'Plan', startWeapon:'Arme de base', forkTier:'Palier', cat_weapons:'Armes', cat_ship:'Vaisseau', cat_power:'Puissance', cat_economy:'Économie', cat_cosmetic:'Cosmétique', cat_synergy:'Synergies', treeHint:'Les voies se choisissent au level-up', addWeapon:'Prendre arme', skillPts:'points', skillHint:'💠 Touchez un nœud pour débloquer', skillNext:'▶ CONTINUER', synOn:'actif', synNeed:'manque',
      balance:'Solde', shopHint:'sauvegardé · toujours plus cher & plus fou', back:'← RETOUR', reallyQ:'SÛR ? ✓ (touche)', resetTitle:'RÉINITIALISER', rs_workshop:'🛠️ Atelier (upgrades + chips)', rs_scores:'🏆 Scores', rs_achskins:'🏅 Succès & skins', rs_all:'⚠️ TOUT EFFACER', rsDone:'✓ OK',
      setTitle:'RÉGLAGES', tapToggle:'Touche pour changer', optShake:'Tremblement', optFx:'Effets d’écran', optCurses:'🎲 Malédictions fun', optGuns:'🔫 Tir / armes', optDmg:'🔢 Chiffres de dégâts', optLang:'🌐 Langue',
      on:'OUI', off:'NON', reduced:'RÉDUIT', activated:'activé', loser:'LOSER', respec:'Réinitialiser', reskilled:'remboursé', crash:'CRASH', points:'Score', record:'Record', newRec:'★ NOUVEAU RECORD ★', again:'REJOUER', share:'📤 PARTAGER', menu:'MENU', best:'BEST',
      lvl:'NIVEAU', newForm:'Nouvelle forme : ', faster:'Plus vite & plus dense !', bossWave:'⚠ VAGUE DE BOSS ', megaBoss:'🛸 MÉGA-BOSS', endgegner:'👾 LE BOSS FINAL', finaleSub:'survis à l’enfer !',
      survived:'SURVÉCU !', defeated:'VAINCU ! 💥', escaped:'🛸 ENFUI…', escapedSub:'le butin s’envole !', armUp:'Équipe-toi pour le boss · Niveau ',
      overdrive:'⚡ OVERDRIVE', overdriveSub:'tu es en feu !', enrage:'🔥 ENRAGE !', enrageSub:'il pète un câble !',
      beaten:'🏆 TERMINÉ !', beatenSub:'…mais ça ne s’arrête pas.', madness:'☣ MODE FOLIE', madnessSub:'jusqu’où iras-tu ?', clearedTag:'🏆 TERMINÉ !  ·  ',
      shieldGone:'BOUCLIER PERDU !', comboGoneZ:'COMBO PERDU', lifeLost:'−1 ♥', livesLeft:' ♥ RESTANT', comboOut:'COMBO FINI', perfect:'PARFAIT ! 🎯', daily2:'🗓 DAILY',
      pSchild:'BOUCLIER', pSlow:'RALENTI', pMagnet:'AIMANT', pDouble:'SCORE ✕2', pBomb:'BOMBE', boom:'BOUM !', boomSub:' pulvérisés', curseTag:'🎲 MALÉDICTION',
      shareScore:' points ! Bats-moi 🔥 ', beatMe:'BATS-MOI. 🔥', pointsBig:'POINTS', dailyLbl:'DAILY', modeDaily:'DAILY',
      achBtn:'🏅 SUCCÈS', achTitle:'SUCCÈS', achGot:'🏅 SUCCÈS', locked:'verrouillé', active:'ACTIF', choose:'CHOISIR', customShip:'Vaisseau perso', newShip:'Nouveau', del:'Supprimer', shipDefault:'Vaisseau', design:'Créer', edit:'Modifier', pixels:'Pixels', templates:'Modèles', glowUnlock:'Débloquer glow',
      near:['JUSTE !','presque touché','esquive propre','ZOU !','fr fr','skill 🔥','OUF !'],
      combo:{3:'W COMBO',5:'GOATED 🐐',8:'SIGMA 🗿',12:'+1000 AURA',16:'DIVIN fr',20:'NO CAP 🔥',24:'CYBER-DIEU'},
      quips:["Ton toi en pixels fait maintenant partie du sol.","Mort par carré. Quelle dignité.","Bonne nouvelle : ça n’a fait mal qu’une frame.","R.I.P. – Rendu En Pièces.","Même le tutoriel pleure.","Des réflexes de paresseux sous mélatonine.","Bravo ! Tu as trouvé le sol.","Les dieux de la synthwave secouent la tête.","Tu avais UNE mission.","Statistiquement : gênant."],
      insults:["Faible. Vraiment faible.","Alerte loser. 🚨","Ma mamie esquive mieux.","Git gud, qu’ils disent.","Assieds-toi. Zéro.","skill issue tbh.","−1000 d’aura, mec.","mid. juste mid.","assieds-toi, frère.","0 rizz, 0 skill.","ratio. L. cope.","mort de PNJ détectée."],
      dumb:["le frère a juste… ouais.","c’est lowkey mid","les vrais savent","no cap fr fr","fais-toi plaisir, mec","sigma move 🗿","valide. juste valide.","slay 💅","based ngl","ça gratte le cerveau","de l’aura ou juste du lag ?","aucune idée de ce qui se passe","hein ? peu importe."],
      crazy:["esquive · collecte · survis","essaie de pas mourir (tu vas mourir)","100% chiptune, 0% pitié","déjà explosé aujourd’hui ?","no cap, ça va être mid","tes réflexes vendus ? récupère-les ici"]
    }
  };
  // Upgrade-Karten- & Werkstatt-Übersetzungen [Name, Beschreibung]
  const UPTR={
    de:{radar:['Radar','Near-Miss-Radius +45%'],shieldgen:['Schildgenerator','+1 Schild & +1 pro Boss'],glass:['Glaskanone','+30% Punkte, +15% Hitbox'],nimble:['Flink','Reaktion schneller'],small:['Kompakt','Hitbox −18%'],orbval:['Orb-Veredelung','Orbs +60% Punkte'],magnet:['Magnetfeld','Dauerhafter Orb-Sog'],loot:['Glücksbringer','Power-Up-Drop-Chance +50%'],combo:['Combo-Anker','+1 Combo je Near-Miss'],reflex:['Reflex-Kern','Slow-Mo +50% länger'],heart:['Extra-Herz','+1 Leben'],banana:['Bananen-Boden','Steuerung rutschig, +65% Punkte'],smol:['Smol Brain','Hitbox +28%, +2 Schild'],energy:['Energy-Drink-OD','Gegner +22% schnell, Radar +75%'],blind:['Drip aber blind','Sicht eng, +90% Punkte'],clown:['Clown-Modus','+30% Gedränge, Orbs ×2'],mirror:['Spiegelwelt','Steuerung gespiegelt, +55% Punkte'],blaster:['Blaster','Auto-Feuer · +Feuerrate'],twin:['Doppellauf','+1 Bolzen · je Bolzen schwächer'],power:['Schadenskern','+1 Schaden'],pierce:['Durchschlag','Bolzen durchschlägt +1'],missile:['Lenkraketen','Zielsuchend · Explosion (AoE)'],flame:['Brandbolzen','Entzündet Ziele (Brennschaden)'],frost:['Frostschuss','Vereist & verlangsamt Ziele'],chain:['Kettenblitz','Kill springt auf nahe Ziele'],amp:['Verstärker','+22% Schaden für ALLE Waffen'],tempo:['Taktung','ALLE Waffen feuern 14% schneller'],crit:['Zielfokus','+11% Krit-Chance (×2 Schaden)']},
    en:{radar:['Radar','Near-miss radius +45%'],shieldgen:['Shield Gen','+1 shield & +1 per boss'],glass:['Glass Cannon','+30% score, +15% hitbox'],nimble:['Nimble','Faster reaction'],small:['Compact','Hitbox −18%'],orbval:['Orb Refining','Orbs +60% score'],magnet:['Magnet Field','Permanent orb pull'],loot:['Lucky Charm','Power-up drop chance +50%'],combo:['Combo Anchor','+1 combo per near-miss'],reflex:['Reflex Core','Slow-mo +50% longer'],heart:['Extra Heart','+1 life'],banana:['Banana Floor','Slippery steering, +65% score'],smol:['Smol Brain','Hitbox +28%, +2 shield'],energy:['Energy-Drink OD','Enemies +22% fast, radar +75%'],blind:['Drip but Blind','Limited view, +90% score'],clown:['Clown Mode','+30% crowd, orbs ×2'],mirror:['Mirror World','Steering flipped, +55% score'],blaster:['Blaster','Auto-fire · +fire rate'],twin:['Twin Barrel','+1 bolt · each bolt weaker'],power:['Damage Core','+1 damage'],pierce:['Piercing','Bolt pierces +1'],missile:['Homing Missiles','Seeking · explosion (AoE)'],flame:['Flame Bolts','Ignites targets (burn damage)'],frost:['Frost Shot','Freezes & slows targets'],chain:['Chain Lightning','Kills arc to nearby targets'],amp:['Amplifier','+22% damage for ALL weapons'],tempo:['Cadence','ALL weapons fire 14% faster'],crit:['Focus','+11% crit chance (×2 damage)']},
    fr:{radar:['Radar','Rayon near-miss +45%'],shieldgen:['Générateur','+1 bouclier & +1 par boss'],glass:['Canon de Verre','+30% score, +15% hitbox'],nimble:['Agile','Réaction plus vive'],small:['Compact','Hitbox −18%'],orbval:['Raffinage d’Orbe','Orbes +60% score'],magnet:['Champ Magnétique','Attraction permanente'],loot:['Porte-Bonheur','Chance de drop +50%'],combo:['Ancre Combo','+1 combo par near-miss'],reflex:['Noyau Réflexe','Ralenti +50% plus long'],heart:['Cœur Bonus','+1 vie'],banana:['Sol Banane','Pilotage glissant, +65% score'],smol:['Smol Brain','Hitbox +28%, +2 bouclier'],energy:['Energy-Drink OD','Ennemis +22% vite, radar +75%'],blind:['Drip mais Aveugle','Vue réduite, +90% score'],clown:['Mode Clown','+30% foule, orbes ×2'],mirror:['Monde Miroir','Pilotage inversé, +55% score'],blaster:['Blaster','Tir auto · +cadence'],twin:['Double Canon','+1 projectile · chacun plus faible'],power:['Noyau de Dégâts','+1 dégât'],pierce:['Perforant','Le tir traverse +1'],missile:['Missiles Guidés','À tête chercheuse · explosion (AoE)'],flame:['Tirs Incendiaires','Enflamme les cibles (brûlure)'],frost:['Tir de Givre','Gèle et ralentit les cibles'],chain:['Éclair en Chaîne','Le kill rebondit sur les cibles'],amp:['Amplificateur','+22% dégâts pour TOUTES les armes'],tempo:['Cadence','TOUTES les armes tirent 14% plus vite'],crit:['Focalisation','+11% chance de critique (×2 dégâts)']}
  };
  // Waffen (Basis), Skill-Pfade & Synergien – [Name, Beschreibung]
  const WTR={
    de:{blaster:['Blaster','Auto-Bolzen nach oben'],missile:['Lenkraketen','Zielsuchend · Explosion (AoE)'],flame:['Brandbolzen','Entzündet Ziele (Brennschaden)'],frost:['Frostschuss','Vereist & verlangsamt Ziele'],chain:['Kettenblitz','Zappt das nächste Ziel · Kette'],nova:['Nova-Puls','Schockwelle rundum (Nahbereich-AoE)'],rail:['Railgun','Sofort-Schiene · trifft die ganze Spalte']},
    en:{blaster:['Blaster','Auto-bolts upward'],missile:['Homing Missiles','Seeking · explosion (AoE)'],flame:['Flame Bolts','Ignites targets (burn)'],frost:['Frost Shot','Freezes & slows'],chain:['Chain Lightning','Zaps nearest target · chains'],nova:['Nova Pulse','Shockwave around you (close AoE)'],rail:['Railgun','Instant rail · hits the whole column']},
    fr:{blaster:['Blaster','Tirs auto vers le haut'],missile:['Missiles Guidés','À tête chercheuse · explosion'],flame:['Tirs Incendiaires','Enflamme (brûlure)'],frost:['Tir de Givre','Gèle et ralentit'],chain:['Éclair en Chaîne','Frappe la cible la plus proche · chaîne'],nova:['Pulsar Nova','Onde de choc autour de toi (AoE)'],rail:['Railgun','Rail instantané · toute la colonne']}
  };
  const PTR={
    de:{rapid:['Schnellfeuer','+50% Feuerrate, etwas weniger Schaden'],heavy:['Wuchtschuss','Langsamer, aber doppelter Schaden'],scatter:['Streuschuss','+2 Bolzen (Fächer), je schwächer'],precise:['Präzision','+2 Durchschlag, +40% Schaden'],swarm:['Schwarm','2 kleinere Raketen'],warhead:['Sprengkopf','1 große Rakete, +50% Radius'],shrapnel:['Splittergranate','Explosion schleudert Splitter'],incendiary:['Brandsatz','Explosion entzündet Ziele'],ember:['Glut','Über doppelter Brennschaden'],wildfire:['Flächenbrand','Feuer springt beim Tod über'],accel:['Brandbeschleuniger','Brennt schneller (kürzer, härter)'],consume:['Verzehr','Brand-Kills geben Bonuspunkte'],permafrost:['Permafrost','Längere & stärkere Verlangsamung'],glaciate:['Vereisung','Chance, Ziele komplett einzufrieren'],shatter:['Splitterbruch','Gefrorene Ziele zerspringen (AoE)'],brittle:['Spröde','Gefrorene Ziele nehmen +50% Schaden'],fork:['Überschlag','+3 Sprünge, weniger Schaden je Sprung'],highv:['Hochspannung','Weniger Sprünge, viel Schaden + Stun'],stormhit:['Gewitter','Kette auch bei Bolzen-Kills'],dischargeaoe:['Entladung','Jeder Kettentreffer mit kleinem AoE'],shock:['Schockwelle','+50% Puls-Radius'],overload:['Überladung','+90% Schaden, langsamer'],repel:['Abstoßung','Stößt getroffene Ziele zurück'],staticfield:['Statikfeld','Puls verlangsamt getroffene Ziele'],charged:['Aufgeladen','+100% Schaden, langsamer'],autoload:['Schnelllader','+70% Feuerrate, weniger Schaden'],wide:['Breitstrahl','Doppelt so breite Schiene'],overdrive:['Overdrive','+70% Schienen-Schaden'],overcharge:['Hochdruck','+40% Schaden, etwas langsamer'],stabil:['Stabilisator','Enger Fächer, +20% Feuerrate'],volley:['Salve','+1 Bolzen, je etwas schwächer'],lance:['Lanze','+2 Durchschlag, +30% Schaden'],cluster:['Cluster','+1 Rakete, je schwächer'],bunker:['Bunkerbrecher','+50% Schaden, langsamer'],wide_aoe:['Großsprengung','+50% Explosionsradius'],rapidload:['Schnellschacht','+60% Feuerrate, weniger Schaden'],inferno:['Inferno','+85% Brennschaden'],lingering:['Schwelbrand','Brennt 80% länger'],blaze:['Lodern','+50% Feuerrate, etwas weniger Schaden'],firestorm:['Feuersturm','Mehr Glut & Dauer, springt über'],deepfreeze:['Tiefkühlung','Stärkere & längere Verlangsamung'],blizzard:['Blizzard','+50% Feuerrate, weniger Schaden'],absolute:['Absolut-Null','Friert Ziele zuverlässig ein'],frostbite:['Erfrierung','+85% Schaden, langsamer'],arc:['Lichtbogen','+2 Sprünge, weniger Schaden'],conduit:['Hochleiter','+80% Schaden, langsamer'],tempest:['Sturmfront','+50% Feuerrate, weniger Schaden'],paralyze:['Lähmung','Längerer Stun, +Schaden'],expand:['Ausdehnung','+50% Puls-Radius'],collapse:['Implosion','+80% Schaden, enger'],pulsar:['Pulsar','+60% Pulsrate, weniger Schaden'],singularity:['Singularität','Stößt zurück & verlangsamt'],piercebeam:['Breitbahn','+60% Strahlbreite'],hypervelocity:['Hypergeschoss','+80% Schaden, langsamer'],gigawatt:['Gigawatt','+110% Schaden, deutlich langsamer'],repeater:['Schnellschiene','+80% Feuerrate, weniger Schaden']},
    en:{rapid:['Rapid Fire','+50% fire rate, a bit less damage'],heavy:['Heavy Shot','Slower, but double damage'],scatter:['Scatter','+2 bolts (fan), each weaker'],precise:['Precision','+2 pierce, +40% damage'],swarm:['Swarm','2 smaller missiles'],warhead:['Warhead','1 big missile, +50% radius'],shrapnel:['Shrapnel','Explosion flings shards'],incendiary:['Incendiary','Explosion ignites targets'],ember:['Ember','Over double burn damage'],wildfire:['Wildfire','Fire spreads on death'],accel:['Accelerant','Burns faster (shorter, harder)'],consume:['Consume','Burn-kills grant bonus points'],permafrost:['Permafrost','Longer & stronger slow'],glaciate:['Glaciate','Chance to fully freeze targets'],shatter:['Shatter','Frozen targets burst (AoE)'],brittle:['Brittle','Frozen targets take +50% damage'],fork:['Forking','+3 jumps, less damage each'],highv:['High Voltage','Fewer jumps, big damage + stun'],stormhit:['Storm','Chains also on bolt-kills'],dischargeaoe:['Discharge','Each chain hit with small AoE'],shock:['Shockwave','+50% pulse radius'],overload:['Overload','+90% damage, slower'],repel:['Repel','Knocks hit targets back'],staticfield:['Static Field','Pulse slows hit targets'],charged:['Charged','+100% damage, slower'],autoload:['Autoloader','+70% fire rate, less damage'],wide:['Wide Beam','Twice as wide rail'],overdrive:['Overdrive','+70% rail damage'],overcharge:['High Pressure','+40% damage, a bit slower'],stabil:['Stabilizer','Tighter fan, +20% fire rate'],volley:['Volley','+1 bolt, each a bit weaker'],lance:['Lance','+2 pierce, +30% damage'],cluster:['Cluster','+1 missile, each weaker'],bunker:['Bunker Buster','+50% damage, slower'],wide_aoe:['Big Blast','+50% explosion radius'],rapidload:['Fast Rack','+60% fire rate, less damage'],inferno:['Inferno','+85% burn damage'],lingering:['Smoulder','Burns 80% longer'],blaze:['Blaze','+50% fire rate, slightly less damage'],firestorm:['Firestorm','More burn & duration, spreads'],deepfreeze:['Deep Freeze','Stronger & longer slow'],blizzard:['Blizzard','+50% fire rate, less damage'],absolute:['Absolute Zero','Reliably freezes targets'],frostbite:['Frostbite','+85% damage, slower'],arc:['Arc','+2 jumps, less damage'],conduit:['Conduit','+80% damage, slower'],tempest:['Tempest','+50% fire rate, less damage'],paralyze:['Paralyze','Longer stun, +damage'],expand:['Expand','+50% pulse radius'],collapse:['Collapse','+80% damage, tighter'],pulsar:['Pulsar','+60% pulse rate, less damage'],singularity:['Singularity','Knocks back & slows'],piercebeam:['Wide Track','+60% beam width'],hypervelocity:['Hypervelocity','+80% damage, slower'],gigawatt:['Gigawatt','+110% damage, much slower'],repeater:['Fast Rail','+80% fire rate, less damage']},
    fr:{rapid:['Tir Rapide','+50% cadence, un peu moins de dégâts'],heavy:['Tir Lourd','Plus lent, mais double dégâts'],scatter:['Dispersion','+2 projectiles (éventail), plus faibles'],precise:['Précision','+2 perforation, +40% dégâts'],swarm:['Essaim','2 missiles plus petits'],warhead:['Ogive','1 gros missile, +50% rayon'],shrapnel:['Éclats','L’explosion projette des éclats'],incendiary:['Incendiaire','L’explosion enflamme les cibles'],ember:['Braise','Brûlure plus que doublée'],wildfire:['Embrasement','Le feu se propage à la mort'],accel:['Accélérant','Brûle plus vite (court, fort)'],consume:['Consumer','Les kills par feu donnent des points'],permafrost:['Permafrost','Ralenti plus long & plus fort'],glaciate:['Glaciation','Chance de geler totalement'],shatter:['Éclatement','Les cibles gelées éclatent (AoE)'],brittle:['Fragile','Les cibles gelées subissent +50%'],fork:['Ramification','+3 sauts, moins de dégâts'],highv:['Haute Tension','Moins de sauts, gros dégâts + stun'],stormhit:['Orage','Chaîne aussi sur les kills de tir'],dischargeaoe:['Décharge','Chaque saut avec petit AoE'],shock:['Onde de Choc','+50% de rayon'],overload:['Surcharge','+90% dégâts, plus lent'],repel:['Répulsion','Repousse les cibles touchées'],staticfield:['Champ Statique','Le pulsar ralentit les cibles'],charged:['Chargé','+100% dégâts, plus lent'],autoload:['Rechargeur','+70% cadence, moins de dégâts'],wide:['Rail Large','Rail deux fois plus large'],overdrive:['Overdrive','+70% dégâts du rail'],overcharge:['Haute Pression','+40% dégâts, plus lent'],stabil:['Stabilisateur','Éventail serré, +20% cadence'],volley:['Salve','+1 projectile, plus faibles'],lance:['Lance','+2 perforation, +30% dégâts'],cluster:['Grappe','+1 missile, plus faibles'],bunker:['Anti-Bunker','+50% dégâts, plus lent'],wide_aoe:['Grosse Explosion','+50% de rayon'],rapidload:['Chargeur Rapide','+60% cadence, moins de dégâts'],inferno:['Enfer','+85% dégâts de brûlure'],lingering:['Combustion','Brûle 80% plus longtemps'],blaze:['Embrasement','+50% cadence, un peu moins de dégâts'],firestorm:['Tempête de Feu','Plus de brûlure & durée, propage'],deepfreeze:['Grand Froid','Ralenti plus fort & long'],blizzard:['Blizzard','+50% cadence, moins de dégâts'],absolute:['Zéro Absolu','Gèle les cibles de façon fiable'],frostbite:['Gelure','+85% dégâts, plus lent'],arc:['Arc','+2 sauts, moins de dégâts'],conduit:['Conducteur','+80% dégâts, plus lent'],tempest:['Tempête','+50% cadence, moins de dégâts'],paralyze:['Paralysie','Stun plus long, +dégâts'],expand:['Expansion','+50% de rayon'],collapse:['Implosion','+80% dégâts, plus serré'],pulsar:['Pulsar','+60% cadence, moins de dégâts'],singularity:['Singularité','Repousse & ralentit'],piercebeam:['Voie Large','+60% largeur du faisceau'],hypervelocity:['Hypervitesse','+80% dégâts, plus lent'],gigawatt:['Gigawatt','+110% dégâts, bien plus lent'],repeater:['Rail Rapide','+80% cadence, moins de dégâts']}
  };
  const SYNTR={
    de:{thermo:['Thermoschock','Brennende + gefrorene Ziele nehmen massiven Schaden'],super:['Supraleiter','Kette +1 Sprung & +50% an Gefrorenen'],napalm:['Napalm','Raketen hinterlassen Brand im Explosionsradius'],tesla:['Tesla-Salve','Jeder 5. Blaster-Bolzen verzweigt als Blitz'],icebomb:['Eisbombe','Raketen-Explosion vereist Ziele'],cryonova:['Cryonova','Nova-Puls verlangsamt zusätzlich alle Ziele'],plasma:['Plasma-Schiene','Railgun entzündet getroffene Ziele'],voltspark:['Voltbogen','Jeder Ketten-Treffer zündet eine Mini-Nova'],pyrobolt:['Pyro-Bolzen','Blaster-Bolzen entzünden getroffene Ziele'],railnova:['Schienen-Nova','Railgun-Schuss löst eine Nova aus'],cryoshot:['Frost-Salve','Blaster-Bolzen verlangsamen getroffene Ziele'],novabomb:['Nova-Bombe','Raketen-Explosion löst eine Nova aus'],railchain:['Schienen-Kette','Railgun-Treffer starten einen Kettenblitz'],barrage:['Sperrfeuer','Blaster-Bolzen explodieren klein beim Treffer'],shockbolt:['Schock-Bolzen','Jeder Blaster-Kill löst eine Mini-Nova aus'],overclock:['Übertaktung','Blaster feuert 40% schneller'],clusterarc:['Cluster-Bogen','Raketen-Explosion startet einen Kettenblitz'],siege:['Belagerung','Raketen +30% Schaden & Radius'],wildarc:['Brand-Bogen','Kettenblitz entzündet getroffene Ziele'],embernova:['Glut-Nova','Nova-Puls entzündet alle Ziele'],cryorail:['Frost-Schiene','Railgun vereist die getroffene Spalte']},
    en:{thermo:['Thermal Shock','Burning + frozen targets take massive damage'],super:['Superconductor','Chain +1 jump & +50% vs frozen'],napalm:['Napalm','Missiles leave fire in the blast radius'],tesla:['Tesla Volley','Every 5th blaster bolt arcs as lightning'],icebomb:['Ice Bomb','Missile blasts freeze targets'],cryonova:['Cryonova','Nova pulse also slows all targets'],plasma:['Plasma Rail','Railgun ignites targets it hits'],voltspark:['Volt Arc','Each chain hit triggers a mini nova'],pyrobolt:['Pyro Bolt','Blaster bolts ignite the targets they hit'],railnova:['Rail Nova','Railgun shot triggers a nova'],cryoshot:['Frost Volley','Blaster bolts slow the targets they hit'],novabomb:['Nova Bomb','Missile blast triggers a nova'],railchain:['Rail Chain','Railgun hits start a chain lightning'],barrage:['Barrage','Blaster bolts burst on hit'],shockbolt:['Shock Bolt','Every blaster kill triggers a mini nova'],overclock:['Overclock','Blaster fires 40% faster'],clusterarc:['Cluster Arc','Missile blast starts a chain lightning'],siege:['Siege','Missiles +30% damage & radius'],wildarc:['Wild Arc','Chain lightning ignites the targets it hits'],embernova:['Ember Nova','Nova pulse ignites all targets'],cryorail:['Cryo Rail','Railgun freezes the column it hits']},
    fr:{thermo:['Choc Thermique','Cibles en feu + gelées subissent d’énormes dégâts'],super:['Supraconducteur','Chaîne +1 saut & +50% vs gelés'],napalm:['Napalm','Les missiles laissent du feu dans le rayon'],tesla:['Salve Tesla','Chaque 5e tir du blaster se ramifie'],icebomb:['Bombe de Glace','Les explosions de missiles gèlent'],cryonova:['Cryonova','Le pulsar nova ralentit aussi les cibles'],plasma:['Rail Plasma','Le railgun enflamme les cibles touchées'],voltspark:['Arc Volt','Chaque saut de chaîne déclenche une mini-nova'],pyrobolt:['Boulon Pyro','Les tirs du blaster enflamment les cibles'],railnova:['Nova Rail','Le tir du railgun déclenche une nova'],cryoshot:['Salve de Givre','Les tirs du blaster ralentissent les cibles'],novabomb:['Bombe Nova','L’explosion de missile déclenche une nova'],railchain:['Chaîne Rail','Les tirs du railgun lancent un éclair en chaîne'],barrage:['Barrage','Les tirs du blaster explosent à l’impact'],shockbolt:['Boulon Choc','Chaque kill du blaster déclenche une mini-nova'],overclock:['Surcadence','Le blaster tire 40% plus vite'],clusterarc:['Arc en Grappe','L’explosion de missile lance un éclair en chaîne'],siege:['Siège','Missiles +30% dégâts & rayon'],wildarc:['Arc Sauvage','L’éclair en chaîne enflamme les cibles'],embernova:['Nova Braise','Le pulsar nova enflamme toutes les cibles'],cryorail:['Rail Cryo','Le railgun gèle la colonne touchée']}
  };
  // Lustige/ironische Tooltip-Texte (Info-Button). Keys: Waffen-IDs, Meta-IDs, Synergie-IDs, _tier[i] für Fork-Stufen.
  const FLAVOR={
    de:{ blaster:'Der Klassiker. Schießt nach oben und stellt keine Fragen.', missile:'Zielsuchend. Wie ein Ex, der genau weiß, wo du wohnst.', flame:'Macht aus Hindernissen Grillgut. Medium-rare.', frost:'Klimaanlage mit Aggressionsproblem.', chain:'Stromrechnung rauf, Gegnerzahl runter.', nova:'Sicherheitsabstand – jetzt mit Schockwelle.', rail:'Eine Linie. Eine Meinung. Ganze Spalte weg.',
      bp_missile:'Raketen-Bauplan. IKEA, nur tödlich.', bp_flame:'Feuer-Bauplan. Streichholz war gestern.', bp_frost:'Frost-Bauplan. Bring ’ne Jacke mit.', bp_chain:'Blitz-Bauplan. Erdung optional.', bp_nova:'Nova-Bauplan. Urknall im Taschenformat.', bp_rail:'Railgun-Bauplan. Physiklehrer weinen.',
      slot:'Mehr Modul-Platz. Marie Kondo hasst diesen Trick.', veteran:'Du startest mit Erfahrung statt mit Naivität.', wcore:'Mehr Bumms pro Schuss. Studien belegen: viel Bumms.', wtempo:'Schneller feuern. Geduld ist eh überbewertet.', critcore:'Mehr Krits. Glück ist jetzt planbar.', shield:'Startschild. Bonus-Leben für clevere Feiglinge.', tough:'Mehr aushalten. Härter als deine Montagslaune.', solid:'Kleinere Hitbox. Schlank in den Tod schlängeln.', reach:'Mehr Near-Miss-Reichweite. Knapp ist das neue sicher.', score:'Mehr Punkte. Dein Ego dankt es dir.', luck:'Bessere Karten. Das Universum mag dich – kurz.', rich:'Mehr Coins. Kapitalismus, aber in Neon.',
      thermo:'Heiß trifft kalt. Sauna-Aufguss in der Antarktis.', super:'Strom ohne Widerstand. Die Kette dreht komplett frei.', napalm:'Raketen, die nachglühen. Brandschutz hat Feierabend.', tesla:'Jeder 5. Bolzen wird Blitz. Tesla wäre stolz.', icebomb:'Explosion plus Eiswürfel. Cocktail für Hindernisse.', cryonova:'Nova mit Kühlfunktion. Alles wird langsam… und kalt.', plasma:'Railgun, die brennt. Linie mit Nachglühen.', voltspark:'Kette zündet Mini-Novas. Stromschlag-Buffet.', pyrobolt:'Bolzen, die anzünden. Feuerzeug mit Zielwasser.', railnova:'Schuss löst Nova aus. Doppelt hält besser.', cryoshot:'Bolzen mit Bremse. Tempolimit für Gegner.', novabomb:'Rakete plus Nova. Explosion hoch zwei.', railchain:'Railgun startet Kettenblitz. Eine Linie, alle leiden.', barrage:'Bolzen mit Mini-Knall. Popcorn, aber gefährlich.', shockbolt:'Jeder Kill ein Mini-Knall. Abgang mit Stil.', overclock:'Blaster 40% schneller. Der Lüfter dreht hoch.', clusterarc:'Raketen-Explosion zündet Kette. Domino deluxe.', siege:'Raketen größer & härter. Türen? Welche Türen.', wildarc:'Kettenblitz, der entzündet. Strom + Feuer = Chaos.', embernova:'Nova entzündet alles. Lagerfeuer, nur tödlich.', cryorail:'Railgun vereist die Spalte. Tiefkühl-Express.',
      tier:{ blaster:['Erste Bolzen – süß, fast harmlos.','Jetzt mit Nachdruck. Pew-pew wird ernst.','Dauerfeuer. Der Abzug glüht.','Bolzen-Apokalypse. Wer zählt noch mit?'],
        missile:['Erste Rakete. Zielt grob in die richtige Richtung.','Mehr Sprengkraft. Die Versicherung kündigt.','Salven mit Suchkopf. Niemand entkommt.','Raketenhagel. Der Himmel brennt.'],
        flame:['Ein Fünkchen. Marshmallows bereithalten.','Es lodert. Der Rauchmelder piept nervös.','Flächenbrand. Die Feuerwehr gibt auf.','Inferno. Pyromanen weinen vor Freude.'],
        frost:['Leichter Frost. Jacke wäre clever.','Es wird glatt. Vorsicht, rutschig.','Permafrost. Gegner machen Winterschlaf.','Eiszeit. Selbst die Physik friert ein.'],
        chain:['Erster Funke. Statisch wie ein Pulli.','Es zappt. Die Haare stehen zu Berge.','Gewitter im Nahbereich. Erdung dringend.','Stromausfall in der ganzen Stadt. Ups.'],
        nova:['Kleiner Schubs. Persönlicher Raum, höflich.','Schockwelle. Jetzt mit Ansage.','Druckwelle wie ein Bass-Drop. Wände wackeln.','Urknall to go. Bitte Abstand halten.'],
        rail:['Erste Linie. Lineal mit Attitude.','Durchschuss. Die Spalte sagt aua.','Hyperschuss. Der Physiklehrer schwitzt.','Gigawatt-Strahl. Die Realität bekommt Risse.'] },
      path:{ rapid:'Finger am Abzug festgeklebt.', heavy:'Selten, aber dann tut’s richtig weh.', scatter:'Gießkanne, aber mit Bolzen.', precise:'Durchschlag-Diplom mit Auszeichnung.', overcharge:'Mehr Druck im Lauf.', stabil:'Ruhige Hand, enges Muster.', volley:'Einer geht noch. Immer.', lance:'Spießt alles auf wie Grillgut.', swarm:'Zwei kleine Quälgeister statt einem.', warhead:'Größe ist eben doch alles.', shrapnel:'Teilt aus – im wörtlichsten Sinn.', incendiary:'Explosion mit Nachglühen.', cluster:'Je mehr, desto Bumms.', bunker:'Klopft auch bei dicken Wänden an.', wide_aoe:'Der Radius grüßt die Nachbarn.', rapidload:'Nachladen? Quasi nie.', ember:'Glüht nach wie ein schlechtes Gewissen.', wildfire:'Teilt das Feuer großzügig.', accel:'Kurz, heiß, schmerzhaft.', consume:'Asche zu Punkten.', inferno:'Medium-rare war gestern.', lingering:'Brennt wie eine alte Rechnung.', blaze:'Dauerflamme, kein Feuerzeug nötig.', firestorm:'Wirbelt Feuer wie Konfetti.', permafrost:'Dauerwinter ohne Heizkosten.', glaciate:'Tiefkühl-Roulette: manchmal komplett vereist.', shatter:'Erst frosten, dann zersplittern.', brittle:'Kalt und zerbrechlich – wie deine Ausreden.', deepfreeze:'Bis aufs Mark durchgekühlt.', blizzard:'Schneesturm im Dauerfeuer.', absolute:'Null Kelvin, null Mitleid.', frostbite:'Erfrierung mit Ansage.', fork:'Springt rum wie auf einer Hüpfburg.', highv:'Ein Schlag, große Wirkung.', stormhit:'Jeder Tote lädt zur Party.', dischargeaoe:'Knistert an allen Ecken.', arc:'Hangelt sich von Ziel zu Ziel.', conduit:'Bester Leiter seit der Hochspannung.', tempest:'Dauergewitter, kein Schirm hilft.', paralyze:'Schockstarre inklusive.', shock:'Mehr Abstand, mehr Respekt.', overload:'Lädt durch, drückt zu.', repel:'Persönlicher Türsteher.', staticfield:'Bremst alles im Umkreis aus.', expand:'Die Welle holt weiter aus.', collapse:'Klein, aber brachial.', pulsar:'Pulsiert wie ein nervöser Bass.', singularity:'Schwarzes Loch im Taschenformat.', charged:'Lange zielen, kurz weinen lassen.', autoload:'Schiene am Fließband.', wide:'Spalte? Eher Schneise.', overdrive:'Voll aufgedreht.', piercebeam:'Trifft auch, was daneben steht.', hypervelocity:'Schneller als deine Reflexe.', gigawatt:'1,21 Gigawatt. Großartig.', repeater:'Schiene auf Repeat.' } },
    en:{ blaster:'The classic. Shoots up, asks no questions.', missile:'Homing. Like an ex who knows your address.', flame:'Turns obstacles into BBQ. Medium-rare.', frost:'Air conditioning with anger issues.', chain:'Power bill up, enemy count down.', nova:'Personal space — now with a shockwave.', rail:'One line. One opinion. Whole column gone.',
      bp_missile:'Missile blueprint. IKEA, but lethal.', bp_flame:'Fire blueprint. Matches are so last season.', bp_frost:'Frost blueprint. Bring a jacket.', bp_chain:'Lightning blueprint. Grounding optional.', bp_nova:'Nova blueprint. Big Bang, travel size.', bp_rail:'Railgun blueprint. Physics teachers cry.',
      slot:'More module space. Marie Kondo hates this trick.', veteran:'Start with experience instead of naivety.', wcore:'More boom per shot. Studies confirm: much boom.', wtempo:'Fire faster. Patience is overrated anyway.', critcore:'More crits. Luck, now schedulable.', shield:'Start shield. A bonus life for clever cowards.', tough:'Take more hits. Tougher than your Monday mood.', solid:'Smaller hitbox. Slim your way out of death.', reach:'More near-miss range. Close is the new safe.', score:'More points. Your ego says thanks.', luck:'Better cards. The universe likes you — briefly.', rich:'More coins. Capitalism, but in neon.',
      thermo:'Hot meets cold. Sauna session in Antarctica.', super:'No resistance. The chain goes fully feral.', napalm:'Missiles that keep burning. Fire safety clocked out.', tesla:'Every 5th bolt becomes lightning. Tesla approves.', icebomb:'Explosion plus ice cubes. A cocktail for obstacles.', cryonova:'Nova with cooling. Everything slows… and chills.', plasma:'A railgun that burns. A line with afterglow.', voltspark:'Chain triggers mini novas. Electro buffet.', pyrobolt:'Bolts that ignite. A lighter with good aim.', railnova:'Shot triggers a nova. Twice is nice.', cryoshot:'Bolts with brakes. Speed limit for enemies.', novabomb:'Missile plus nova. Explosion squared.', railchain:'Railgun starts a chain. One line, everyone suffers.', barrage:'Bolts with mini-blasts. Popcorn, but dangerous.', shockbolt:'Every kill a mini-blast. Exit with style.', overclock:'Blaster 40% faster. The fan spins up.', clusterarc:'Missile blast lights a chain. Domino deluxe.', siege:'Missiles bigger & harder. Doors? What doors.', wildarc:'Chain that ignites. Volts + fire = chaos.', embernova:'Nova ignites everything. Campfire, but lethal.', cryorail:'Railgun freezes the column. Frozen-aisle express.',
      tier:{ blaster:['First bolts — cute, almost harmless.','Now with attitude. Pew-pew gets serious.','Full auto. The trigger glows.','Bolt apocalypse. Who’s still counting?'],
        missile:['First rocket. Aims roughly the right way.','More boom. Insurance cancels.','Homing volleys. Nobody escapes.','Missile storm. The sky is on fire.'],
        flame:['A tiny spark. Ready the marshmallows.','It blazes. The smoke alarm panics.','Wildfire. The fire brigade gives up.','Inferno. Pyromaniacs weep with joy.'],
        frost:['Light frost. A jacket would be smart.','Getting slippery. Mind the ice.','Permafrost. Enemies hibernate.','Ice age. Even physics freezes.'],
        chain:['First spark. Static like a sweater.','It zaps. Hair stands on end.','Close-range thunderstorm. Ground yourself.','City-wide blackout. Oops.'],
        nova:['A little shove. Personal space, politely.','Shockwave. Now with a warning.','Pressure wave like a bass drop. Walls shake.','Big Bang to go. Please keep your distance.'],
        rail:['First line. A ruler with attitude.','Punch-through. The column says ow.','Hypershot. Physics teacher sweats.','Gigawatt beam. Reality starts to crack.'] },
      path:{ rapid:'Finger superglued to the trigger.', heavy:'Rare, but it really hurts.', scatter:'A watering can, but with bolts.', precise:'Pierce diploma, with honors.', overcharge:'More pressure in the barrel.', stabil:'Steady hand, tight pattern.', volley:'Room for one more. Always.', lance:'Skewers everything like BBQ.', swarm:'Two small pests instead of one.', warhead:'Turns out size is everything.', shrapnel:'Lashes out — literally.', incendiary:'Explosion with an afterglow.', cluster:'The more, the boom.', bunker:'Knocks even on thick walls.', wide_aoe:'The blast says hi to the neighbors.', rapidload:'Reloading? Basically never.', ember:'Smoulders like a guilty conscience.', wildfire:'Shares the fire generously.', accel:'Short, hot, painful.', consume:'Ashes into points.', inferno:'Medium-rare is so last patch.', lingering:'Burns like an old bill.', blaze:'Permanent flame, no lighter needed.', firestorm:'Whirls fire like confetti.', permafrost:'Endless winter, no heating bill.', glaciate:'Frozen roulette: sometimes a full freeze.', shatter:'Freeze first, shatter later.', brittle:'Cold and fragile — like your excuses.', deepfreeze:'Chilled to the bone.', blizzard:'Snowstorm on full auto.', absolute:'Zero Kelvin, zero mercy.', frostbite:'Frostbite, as advertised.', fork:'Bounces around like a bouncy castle.', highv:'One hit, big drama.', stormhit:'Every kill RSVPs to the party.', dischargeaoe:'Crackles in every corner.', arc:'Swings from target to target.', conduit:'Best conductor since high voltage.', tempest:'Endless storm, no umbrella helps.', paralyze:'Freeze-frame included.', shock:'More distance, more respect.', overload:'Charges up, slams down.', repel:'Your personal bouncer.', staticfield:'Slows everything around you.', expand:'The wave reaches further.', collapse:'Small, but brutal.', pulsar:'Pulses like a nervous bass line.', singularity:'A black hole, travel size.', charged:'Aim long, make them cry short.', autoload:'Rails off the assembly line.', wide:'Column? More like a clearing.', overdrive:'Cranked all the way up.', piercebeam:'Hits what stands nearby too.', hypervelocity:'Faster than your reflexes.', gigawatt:'1.21 gigawatts. Great Scott.', repeater:'Rail on repeat.' } },
    fr:{ blaster:'Le classique. Tire vers le haut, sans poser de questions.', missile:'À tête chercheuse. Comme un ex qui connaît ton adresse.', flame:'Transforme les obstacles en barbecue. Saignant.', frost:'La clim, version problèmes de colère.', chain:'Facture d’électricité en hausse, ennemis en baisse.', nova:'Distance de sécurité — avec onde de choc.', rail:'Une ligne. Un avis. Colonne entière effacée.',
      bp_missile:'Plan de missiles. IKEA, mais mortel.', bp_flame:'Plan de feu. Les allumettes, c’est dépassé.', bp_frost:'Plan de givre. Prends une veste.', bp_chain:'Plan d’éclairs. Mise à la terre optionnelle.', bp_nova:'Plan de nova. Big Bang format poche.', bp_rail:'Plan de railgun. Les profs de physique pleurent.',
      slot:'Plus de place pour modules. Marie Kondo déteste ça.', veteran:'Commence avec de l’expérience plutôt que la naïveté.', wcore:'Plus de boum par tir. La science confirme : beaucoup de boum.', wtempo:'Tire plus vite. La patience est surcotée.', critcore:'Plus de crits. La chance, désormais planifiable.', shield:'Bouclier de départ. Une vie bonus pour lâches malins.', tough:'Encaisse plus. Plus dur que ton humeur du lundi.', solid:'Hitbox plus petite. Esquive la mort en mode mince.', reach:'Plus de portée de near-miss. Juste, c’est le nouveau sûr.', score:'Plus de points. Ton ego te remercie.', luck:'De meilleures cartes. L’univers t’aime — brièvement.', rich:'Plus de coins. Le capitalisme, mais en néon.',
      thermo:'Le chaud rencontre le froid. Sauna en Antarctique.', super:'Sans résistance. La chaîne part en vrille.', napalm:'Des missiles qui brûlent encore. La sécurité incendie a fini.', tesla:'Chaque 5e tir devient éclair. Tesla approuve.', icebomb:'Explosion plus glaçons. Un cocktail pour obstacles.', cryonova:'Nova avec clim. Tout ralentit… et refroidit.', plasma:'Un railgun qui brûle. Une ligne qui rougeoie.', voltspark:'La chaîne déclenche des mini-novas. Buffet électrique.', pyrobolt:'Des tirs qui enflamment. Un briquet bien visé.', railnova:'Le tir déclenche une nova. Deux valent mieux qu’une.', cryoshot:'Des tirs avec freins. Limitation de vitesse pour ennemis.', novabomb:'Missile plus nova. Explosion au carré.', railchain:'Le railgun lance une chaîne. Une ligne, tout le monde souffre.', barrage:'Des tirs à mini-explosion. Du popcorn, mais dangereux.', shockbolt:'Chaque kill, une mini-explosion. Sortie stylée.', overclock:'Blaster 40% plus rapide. Le ventilo s’emballe.', clusterarc:'L’explosion de missile lance une chaîne. Domino deluxe.', siege:'Missiles plus gros & plus durs. Des portes ? Quelles portes.', wildarc:'Une chaîne qui enflamme. Volts + feu = chaos.', embernova:'La nova enflamme tout. Feu de camp, mais mortel.', cryorail:'Le railgun gèle la colonne. Express rayon surgelés.',
      tier:{ blaster:['Premiers tirs — mignon, presque inoffensif.','Avec du caractère. Le pew-pew devient sérieux.','Tir continu. La détente chauffe.','Apocalypse de tirs. Qui compte encore ?'],
        missile:['Premier missile. Vise à peu près juste.','Plus d’explosif. L’assurance résilie.','Salves à tête chercheuse. Personne n’échappe.','Pluie de missiles. Le ciel s’embrase.'],
        flame:['Une étincelle. Prépare les marshmallows.','Ça flambe. Le détecteur de fumée panique.','Incendie. Les pompiers abandonnent.','Enfer. Les pyromanes pleurent de joie.'],
        frost:['Léger givre. Une veste serait maligne.','Ça glisse. Attention au verglas.','Permafrost. Les ennemis hibernent.','Ère glaciaire. Même la physique gèle.'],
        chain:['Première étincelle. Statique comme un pull.','Ça grésille. Les cheveux se dressent.','Orage rapproché. Mets-toi à la terre.','Panne de courant générale. Oups.'],
        nova:['Une petite poussée. Espace perso, poliment.','Onde de choc. Maintenant annoncée.','Onde de pression façon drop de basse. Les murs tremblent.','Big Bang à emporter. Garde tes distances.'],
        rail:['Première ligne. Une règle qui a du caractère.','Transpercement. La colonne dit aïe.','Hypertir. Le prof de physique transpire.','Rayon gigawatt. La réalité se fissure.'] },
      path:{ rapid:'Doigt collé à la détente.', heavy:'Rare, mais ça fait vraiment mal.', scatter:'Un arrosoir, mais à projectiles.', precise:'Diplôme de perforation, mention bien.', overcharge:'Plus de pression dans le canon.', stabil:'Main sûre, tir groupé.', volley:'Encore un. Toujours.', lance:'Embroche tout comme au barbecue.', swarm:'Deux petits casse-pieds au lieu d’un.', warhead:'La taille, ça compte finalement.', shrapnel:'Distribue — au sens propre.', incendiary:'Explosion avec arrière-feu.', cluster:'Plus on est, plus ça boume.', bunker:'Frappe même les murs épais.', wide_aoe:'Le rayon salue les voisins.', rapidload:'Recharger ? Quasi jamais.', ember:'Couve comme une mauvaise conscience.', wildfire:'Partage le feu généreusement.', accel:'Court, chaud, douloureux.', consume:'Des cendres en points.', inferno:'Le saignant, c’est dépassé.', lingering:'Brûle comme une vieille facture.', blaze:'Flamme permanente, sans briquet.', firestorm:'Fait tourbillonner le feu comme des confettis.', permafrost:'Hiver sans fin, sans facture de chauffage.', glaciate:'Roulette glacée : parfois un gel total.', shatter:'Geler d’abord, briser ensuite.', brittle:'Froid et fragile — comme tes excuses.', deepfreeze:'Glacé jusqu’aux os.', blizzard:'Tempête de neige en rafale.', absolute:'Zéro Kelvin, zéro pitié.', frostbite:'Gelure, comme annoncé.', fork:'Rebondit comme sur un château gonflable.', highv:'Un coup, grand drame.', stormhit:'Chaque mort invite à la fête.', dischargeaoe:'Crépite dans tous les coins.', arc:'Se balance de cible en cible.', conduit:'Meilleur conducteur depuis la haute tension.', tempest:'Orage sans fin, aucun parapluie n’aide.', paralyze:'Arrêt sur image inclus.', shock:'Plus de distance, plus de respect.', overload:'Se charge, écrase.', repel:'Ton videur personnel.', staticfield:'Ralentit tout autour de toi.', expand:'L’onde va plus loin.', collapse:'Petit, mais brutal.', pulsar:'Pulse comme une basse nerveuse.', singularity:'Un trou noir format poche.', charged:'Vise longtemps, fais pleurer vite.', autoload:'Du rail à la chaîne.', wide:'Une colonne ? Plutôt une clairière.', overdrive:'À fond les manettes.', piercebeam:'Touche aussi ce qui est à côté.', hypervelocity:'Plus rapide que tes réflexes.', gigawatt:'1,21 gigawatts. Magnifique.', repeater:'Rail en boucle.' } }
  };
  const FLAV=id=>((FLAVOR[lang]&&FLAVOR[lang][id])||FLAVOR.en[id]||'');
  const flavTier=(id,i)=>{ const T=(FLAVOR[lang]&&FLAVOR[lang].tier)||FLAVOR.en.tier; const a=(T&&T[id])||(FLAVOR.en.tier&&FLAVOR.en.tier[id])||[]; return a[i]||''; };
  const flavPath=p=>{ const P=(FLAVOR[lang]&&FLAVOR[lang].path)||FLAVOR.en.path; return (P&&P[p])||(FLAVOR.en.path&&FLAVOR.en.path[p])||''; };
  const wName=id=>((WTR[lang]&&WTR[lang][id])||WTR.en[id]||[id])[0];
  const wDesc=id=>(((WTR[lang]&&WTR[lang][id])||WTR.en[id]||['',''])[1])||'';
  const pName=id=>((PTR[lang]&&PTR[lang][id])||PTR.en[id]||[id])[0];
  const pDesc=id=>(((PTR[lang]&&PTR[lang][id])||PTR.en[id]||['',''])[1])||'';
  const synName=id=>((SYNTR[lang]&&SYNTR[lang][id])||SYNTR.en[id]||[id])[0];
  const synDesc=id=>(((SYNTR[lang]&&SYNTR[lang][id])||SYNTR.en[id]||['',''])[1])||'';
  // Icons für die Skill-Pfad-Knoten (visueller Baum)
  const PATHICO={rapid:'⏩',heavy:'💢',scatter:'🌬️',precise:'🎯',swarm:'🐝',warhead:'💣',shrapnel:'🎇',incendiary:'🔥',ember:'🥵',wildfire:'🌋',accel:'♨️',consume:'🍽️',permafrost:'🧊',glaciate:'❄️',shatter:'💥',brittle:'🩹',fork:'🌿',highv:'⚡',stormhit:'⛈️',dischargeaoe:'🔆',shock:'🌐',overload:'🟪',repel:'↗️',staticfield:'🕸️',charged:'🔋',autoload:'🔁',wide:'↔️',overdrive:'🚀',overcharge:'🔺',stabil:'🎚️',volley:'🔱',lance:'🗡️',cluster:'🧫',bunker:'🏚️',wide_aoe:'💥',rapidload:'⏬',inferno:'😈',lingering:'🕯️',blaze:'🔆',firestorm:'🌪️',deepfreeze:'🧊',blizzard:'🌨️',absolute:'❄️',frostbite:'🦷',arc:'🌈',conduit:'🔌',tempest:'🌩️',paralyze:'💫',expand:'⭕',collapse:'🕳️',pulsar:'💠',singularity:'🌌',piercebeam:'🛤️',hypervelocity:'☄️',gigawatt:'🔋',repeater:'🚄'};
  const METATR={
    de:{slot:['Modul-Slot','+1 Waffen-Slot (max 5)'],bp_missile:['Bauplan: Raketen','Schaltet Lenkraketen dauerhaft frei – im Run baubar'],bp_flame:['Bauplan: Brand','Schaltet Brandbolzen dauerhaft frei – im Run baubar'],bp_frost:['Bauplan: Frost','Schaltet Frostschuss dauerhaft frei – im Run baubar'],bp_chain:['Bauplan: Kette','Schaltet Kettenblitz dauerhaft frei – im Run baubar'],bp_nova:['Bauplan: Nova','Schaltet den Nova-Puls dauerhaft frei – im Run baubar'],bp_rail:['Bauplan: Railgun','Schaltet die Railgun dauerhaft frei – im Run baubar'],shield:['Startschild','+1 Schild zu Beginn je Stufe'],tough:['Zähigkeit','+1 Leben zu Beginn je Stufe'],solid:['Solide Hülle','Start-Hitbox −5% je Stufe'],reach:['Fern-Sensor','Near-Miss-Radius +9% je Stufe'],score:['Punkte-Boost','+15% Punkte je Stufe'],luck:['Glückssträhne','Power-Up-Droprate +10% je Stufe'],rich:['Chip-Magnet','+12% Chip-Ausbeute je Stufe'],veteran:['Veteran','+1 Start-Skillpunkt je Stufe'],wcore:['Waffenkern','ALLE Waffen +6% Schaden je Stufe'],wtempo:['Taktchip','ALLE Waffen +5% Feuerrate je Stufe'],critcore:['Zielkern','+3% Krit-Chance je Stufe']},
    en:{slot:['Module Slot','+1 weapon slot (max 5)'],bp_missile:['Blueprint: Missiles','Unlocks homing missiles permanently · build it in-run'],bp_flame:['Blueprint: Flame','Unlocks flame bolts permanently · build it in-run'],bp_frost:['Blueprint: Frost','Unlocks frost shot permanently · build it in-run'],bp_chain:['Blueprint: Chain','Unlocks chain lightning permanently · build it in-run'],bp_nova:['Blueprint: Nova','Unlocks the Nova pulse permanently · build it in-run'],bp_rail:['Blueprint: Railgun','Unlocks the railgun permanently · build it in-run'],shield:['Start Shield','+1 shield at start per lvl'],tough:['Toughness','+1 life at start per lvl'],solid:['Solid Hull','Start hitbox −5% per lvl'],reach:['Far Sensor','Near-miss radius +9% per lvl'],score:['Score Boost','+15% score per lvl'],luck:['Lucky Streak','Power-up drop rate +10% per lvl'],rich:['Chip Magnet','+12% chip yield per lvl'],veteran:['Veteran','+1 start skill point per lvl'],wcore:['Weapon Core','ALL weapons +6% damage per lvl'],wtempo:['Cadence Chip','ALL weapons +5% fire rate per lvl'],critcore:['Focus Core','+3% crit chance per lvl']},
    fr:{slot:['Slot de Module','+1 slot d’arme (max 5)'],bp_missile:['Plan: Missiles','Débloque les missiles (jouable en partie)'],bp_flame:['Plan: Feu','Débloque les tirs incendiaires'],bp_frost:['Plan: Givre','Débloque le tir de givre'],bp_chain:['Plan: Chaîne','Débloque l’éclair en chaîne'],bp_nova:['Plan: Nova','Débloque le pulsar nova'],bp_rail:['Plan: Railgun','Débloque le railgun'],shield:['Bouclier de Départ','+1 bouclier au départ/niv'],tough:['Robustesse','+1 vie au départ/niv'],solid:['Coque Solide','Hitbox de départ −5%/niv'],reach:['Capteur Lointain','Rayon near-miss +9%/niv'],score:['Boost de Score','+15% score/niv'],luck:['Veine','Taux de drop +10%/niv'],rich:['Aimant à Chips','+12% de chips/niv'],veteran:['Vétéran','+1 point de skill au départ/niv'],wcore:['Noyau d’Arme','TOUTES les armes +6% dégâts/niv'],wtempo:['Puce de Cadence','TOUTES les armes +5% cadence/niv'],critcore:['Noyau de Focus','+3% chance de critique/niv']}
  };
  const uName=id=>((UPTR[lang]&&UPTR[lang][id])||UPTR.en[id]||UPTR.de[id]||[id])[0];
  const uDesc=id=>(((UPTR[lang]&&UPTR[lang][id])||UPTR.en[id]||UPTR.de[id]||['',''])[1])||'';
  const mName=id=>((METATR[lang]&&METATR[lang][id])||METATR.en[id]||METATR.de[id]||[id])[0];
  const mTxt =id=>(((METATR[lang]&&METATR[lang][id])||METATR.en[id]||METATR.de[id]||['',''])[1])||'';
  let shopTab='weapons';   // aktiver Werkstatt-Reiter
  const SHOPTABS=[['weapons','⚔️'],['synergy','🔗'],['ship','🛡️'],['power','💥'],['economy','◈'],['cosmetic','🎨']];
  const shopName=m=> m.id.indexOf('fu_')===0 ? wName(m.id.slice(3))+' – Pfade' : mName(m.id);
  const shopDesc=m=> m.id.indexOf('fu_')===0 ? (wArch(m.id.slice(3))+' · nächste Skill-Pfad-Stufe (im Run wählbar)') : (mTxt(m.id)+(m.id.indexOf('bp_')===0?(' · '+wArch(m.id.slice(3))):''));
  const FORMTR={de:{sine:'Wellenflug',drift:'Gleiter',orbit:'Kreisel',zigzag:'Irrläufer',pendulum:'Pendler'},
    en:{sine:'Wave Flight',drift:'Glider',orbit:'Orbiter',zigzag:'Zigzagger',pendulum:'Pendulum'},
    fr:{sine:'Vol Ondulé',drift:'Planeur',orbit:'Orbiteur',zigzag:'Zigzagueur',pendulum:'Pendule'}};
  const formName=k=>((FORMTR[lang]&&FORMTR[lang][k])||FORMTR.en[k]||k);
  const modeLabel=m=>t('m_'+(m==='hardcore'?'hard':m));

  let player, obstacles, orbs, powerups, particles, floaters, lasers, stars, bullets, gems;
  let tBlast=0, tMiss=0, tFlame=0, tFrost=0, tChain=0, tNova=0, tRail=0, teslaCount=0, bossPending=false, boss=null, ebullets=[], gemT=0, beams=[], zaps=[], novas=[], gibs=[];
  let score, displayScore, combo, multiplier, best=loadScores();
  function loadScores(){ try{ const r=JSON.parse(localStorage.getItem('neondrift_best')); if(r&&typeof r==='object') return {normal:r.normal||0,hardcore:r.hardcore||0,zen:r.zen||0,daily:r.daily||0,dailyDate:r.dailyDate||''}; }catch(e){} return {normal:0,hardcore:0,zen:0,daily:0,dailyDate:''}; }
  function saveScores(){ try{ localStorage.setItem('neondrift_best',JSON.stringify(best)); }catch(e){} }
  // Meta-Progression: persistente Chips + dauerhafte Upgrade-Stufen
  let meta=loadMeta();
  function loadMeta(){ try{ const r=JSON.parse(localStorage.getItem('neondrift_meta')); if(r&&typeof r==='object'){
    const ships=Array.isArray(r.ships)?r.ships:((r.customShip&&r.customShip.cells)?[{name:'Schiff 1',cells:r.customShip.cells}]:[]);   // Migration: alt-customShip -> ships[0]
    return {chips:r.chips||0,lvl:r.lvl||{},won:r.won||0,shopDate:r.shopDate||'',ach:r.ach||{},stats:r.stats||{},skins:r.skins||{},skin:r.skin||'std',diff:r.diff||0,ships,shipSlot:r.shipSlot||0}; } }catch(e){}
    return {chips:0,lvl:{},won:0,shopDate:'',ach:{},stats:{},skins:{},skin:'std',diff:0,ships:[],shipSlot:0}; }
  function saveMeta(){ try{ localStorage.setItem('neondrift_meta',JSON.stringify(meta)); }catch(e){} }
  // ---- Schwierigkeitsgrade (Baby = aktuelles Balancing = leichteste Stufe; höhere Stufen ziehen Tempo & Dichte ganz leicht an) ----
  const DIFFS=[
    {name:'👶 Baby',                         mul:0.85},
    {name:'🙈 Schau mal Mama',               mul:1.05},
    {name:'😎 Normalo',                      mul:1.28},
    {name:'📱 Doomscroll-König',             mul:1.55},
    {name:'🚽 Toiletten-Kaiser',            mul:1.85},
    {name:'💀 Chuck Norris ist hier gestorben', mul:2.20}
  ];
  let diffMul=1, diffSpd=1, diffHp=1, diffDen=1, diffChip=1;   // werden beim Spielstart aus meta.diff abgeleitet
  const fmt=n=>{ n=Math.round(n||0); return n>=10000?(n/1000).toFixed(n>=100000?0:1)+'k':''+n; };
  function statN(k){ return (meta.stats&&meta.stats[k])||0; }
  function addStat(k,n){ meta.stats=meta.stats||{}; meta.stats[k]=(meta.stats[k]||0)+n; }
  // Werkstatt-Upgrades: Kosten = Basis × Stufe^1.8 (zwischen linear & exponentiell) & immer krasser
  const META=[
    // Waffen-Baupläne: dauerhafte Freischaltung (max 1) → danach im Run per Skillpunkten baubar. Langsame Sammel-Progression.
    {id:'bp_missile',  ico:'🚀',name:'Bauplan: Raketen',base:120, max:1},
    {id:'bp_flame',    ico:'🔥',name:'Bauplan: Brand',  base:180, max:1},
    {id:'bp_frost',    ico:'❄️',name:'Bauplan: Frost',  base:260, max:1},
    {id:'bp_chain',    ico:'⛓️',name:'Bauplan: Kette',  base:360, max:1},
    {id:'bp_nova',     ico:'🟣',name:'Bauplan: Nova',   base:500, max:1},
    {id:'bp_rail',     ico:'⚡',name:'Bauplan: Railgun', base:680, max:1},
    {id:'slot',        ico:'🧩',name:'Modul-Slot',   base:600,max:2},
    {id:'veteran',     ico:'🎖️',name:'Veteran',      base:300,max:2},
    {id:'wcore',       ico:'💥',name:'Waffenkern',   base:240,max:4},
    {id:'wtempo',      ico:'⏩',name:'Taktchip',     base:240,max:4},
    {id:'critcore',    ico:'🎯',name:'Zielkern',     base:280,max:3},
    {id:'shield',      ico:'🛡️',name:'Startschild',  base:110,max:3},
    {id:'tough',       ico:'💗',name:'Zähigkeit',    base:420,max:2},
    {id:'solid',       ico:'🔻',name:'Solide Hülle', base:80, max:4},
    {id:'reach',       ico:'📡',name:'Fern-Sensor',  base:70, max:4},
    {id:'score',       ico:'💎',name:'Punkte-Boost', base:130,max:4},
    {id:'luck',        ico:'🎁',name:'Glückssträhne',base:100,max:3},
    {id:'rich',        ico:'◈', name:'Chip-Magnet',  base:60, max:6}
  ];
  const metaCost=(m,lvl)=>Math.round(m.base*Math.pow(lvl+1,2.2)/10)*10;   // steilere Kurve: je höher die Stufe, desto teurer (krasser Grind oben)
  const metaLvl=id=>(meta.lvl&&meta.lvl[id])||0;
  function chipMult(){ return 1+0.12*metaLvl('rich'); }
  // Fork-Stufen werden in der Werkstatt freigeschaltet (fu_<waffe> = Anzahl freier Fork-Slots, 0..4)
  const FORKI={f1:1,f2:2,f3:3,f4:4};
  // Alle Fork-Stufen werden in der Werkstatt freigeschaltet (fu_<id> = 0..4) – vorher nicht wählbar
  const forkShopOpen=(id,slot)=> (metaLvl('fu_'+id)||0) >= FORKI[slot];
  // Werkstatt-Kategorien (für Tab-UI)
  function shopCat(id){ if(id.indexOf('sy_')===0) return 'synergy';
    if(id==='pxpack'||id==='pxglow') return 'cosmetic';   // im Editor verkauft, nicht als generische Karte
    if(id.indexOf('bp_')===0||id.indexOf('fu_')===0||id==='slot'||id==='veteran') return 'weapons';
    if(id==='shield'||id==='tough'||id==='solid'||id==='reach') return 'ship';
    if(id==='wcore'||id==='wtempo'||id==='critcore') return 'power';
    return 'economy'; }
  // Werkstatt täglich zurücksetzen (Schalter); Trophäen bleiben immer
  function dailyShopCheck(){ if(opt.dailyShop && meta.shopDate!==dailyLabel()){ meta.chips=0; meta.lvl={}; meta.shopDate=dailyLabel(); saveMeta(); } }
  const weaponUnlocked=id=> id==='blaster' || metaLvl('bp_'+id)>0;
  function applyMeta(){
    arsenal.slots=3+metaLvl('slot');                       // Werkstatt: Modul-Slots (max +2 → 5)
    arsenal.w={};
    // Roguelite-Start: jeder Run beginnt nur mit dem Blaster (Lvl 1); alle anderen Waffen baust du im Run per Skillpunkten auf.
    if(opt.guns){ arsenal.w.blaster={lvl:1,f1:null,f2:null,f3:null,f4:null}; skillPts=1; }   // +1 Startpunkt → sofort 2. Waffe deiner Wahl
    if(opt.guns && mode==='zen'){ arsenal.slots=WEAPONS.length;   // ZEN = Sandbox: alle Waffen VOLL ausgebaut (Lvl 5, alle 4 Skill-Pfade zufällig) statt nackt auf Lvl 1
      for(const w of WEAPONS) arsenal.w[w.id]={lvl:5, f1:w.forks[0][Math.random()<0.5?0:1], f2:w.forks[1][Math.random()<0.5?0:1], f3:w.forks[2][Math.random()<0.5?0:1], f4:w.forks[3][Math.random()<0.5?0:1]};
      skillPts=0; }
    const sh=metaLvl('shield'); if(sh) shields=Math.min(shields+sh,5);
    const to=metaLvl('tough'); if(to) lives=Math.min(lives+to,6);
    const so=metaLvl('solid'); if(so){ mods.playerR*=Math.pow(0.95,so); player.r=mods.playerR; }
    const re=metaLvl('reach'); if(re) mods.nearRadius*=(1+0.09*re);
    const scn=metaLvl('score'); if(scn) mods.scoreMult*=(1+0.15*scn);
    const lu=metaLvl('luck'); if(lu) mods.powerupRate*=(1+0.10*lu);
    const vt=metaLvl('veteran'); if(vt && opt.guns) skillPts+=vt;                      // Werkstatt: Start-Skillpunkte → tiefere Forks schneller erreichbar
    const wc=metaLvl('wcore');  if(wc) mods.wDmgMult=(mods.wDmgMult||1)*(1+0.06*wc);   // ALLE Waffen mehr Schaden
    const wt=metaLvl('wtempo'); if(wt) mods.wRate=(mods.wRate||1)*(1+0.05*wt);         // ALLE Waffen schneller
    const cr=metaLvl('critcore'); if(cr) mods.critBase=(mods.critBase||0)+0.03*cr;     // Krit-Basis
    recalcArsenal();
  }
  // ---------- Erfolge / Achievements ----------
  const ACH=[
    {id:'firstNear',ico:'😎'},{id:'combo10',ico:'🔗'},{id:'combo20',ico:'⚡'},{id:'combo30',ico:'👑'},
    {id:'perfect10',ico:'🎯'},{id:'boss5',ico:'🌊'},{id:'mega',ico:'🛸'},{id:'won',ico:'🏆'},
    {id:'madness',ico:'☣'},{id:'orbs1000',ico:'🔷'},{id:'chips10k',ico:'◈'},{id:'allmodes',ico:'🎮'},
    {id:'curse',ico:'🎲'},{id:'daily',ico:'🗓'}
  ];
  const ACHTR={
    de:{firstNear:['Hauchzart','Erster Near-Miss'],combo10:['Im Flow','Combo x10'],combo20:['Brandheiß','Combo x20'],combo30:['Göttlich','Combo x30'],perfect10:['Millimeterarbeit','10× PERFEKT'],boss5:['Wellenbrecher','Boss 5 erreicht'],mega:['Drachentöter','Mega-Boss besiegt'],won:['Durchgespielt','Den Endgegner besiegt'],madness:['Wahnsinnig','60 s im Wahnsinn-Modus'],orbs1000:['Sammler','1.000 Orbs gesamt'],chips10k:['Reich','10.000 Chips verdient'],allmodes:['Vielspieler','Alle 3 Modi gespielt'],curse:['Risikofreudig','Einen Fluch eingesammelt'],daily:['Stammgast','Daily gespielt']},
    en:{firstNear:['Hair’s Breadth','First near-miss'],combo10:['In the Flow','Combo x10'],combo20:['Red Hot','Combo x20'],combo30:['Godlike','Combo x30'],perfect10:['Precision','10× PERFECT'],boss5:['Wavebreaker','Reached boss 5'],mega:['Dragonslayer','Defeated a mega-boss'],won:['Completed','Beat the final boss'],madness:['Unhinged','60 s in madness mode'],orbs1000:['Collector','1,000 orbs total'],chips10k:['Rich','Earned 10,000 chips'],allmodes:['All-Rounder','Played all 3 modes'],curse:['Risk-Taker','Grabbed a curse'],daily:['Regular','Played the daily']},
    fr:{firstNear:['À un cheveu','Premier near-miss'],combo10:['Dans le flow','Combo x10'],combo20:['Brûlant','Combo x20'],combo30:['Divin','Combo x30'],perfect10:['Précision','10× PARFAIT'],boss5:['Brise-vagues','Boss 5 atteint'],mega:['Tueur de dragon','Méga-boss vaincu'],won:['Terminé','Boss final vaincu'],madness:['Cinglé','60 s en mode folie'],orbs1000:['Collectionneur','1 000 orbes au total'],chips10k:['Riche','10 000 chips gagnés'],allmodes:['Polyvalent','Joué les 3 modes'],curse:['Téméraire','Ramassé une malédiction'],daily:['Habitué','Joué le daily']}
  };
  const achName=id=>((ACHTR[lang]&&ACHTR[lang][id])||ACHTR.en[id]||[id])[0];
  const achDesc=id=>(((ACHTR[lang]&&ACHTR[lang][id])||ACHTR.en[id]||['',''])[1])||'';
  const STATTR={
    de:{stats:'STATISTIK',runs:'Runs',orbs:'Orbs',near:'Near-Misses',perfect:'Perfekt',bosses:'Bosse',maxCombo:'Top-Combo',maxBoss:'Top-Boss',chipsTotal:'Chips gesamt',won:'Siege'},
    en:{stats:'STATISTICS',runs:'Runs',orbs:'Orbs',near:'Near-misses',perfect:'Perfect',bosses:'Bosses',maxCombo:'Top combo',maxBoss:'Top boss',chipsTotal:'Total chips',won:'Wins'},
    fr:{stats:'STATISTIQUES',runs:'Parties',orbs:'Orbes',near:'Near-miss',perfect:'Parfait',bosses:'Boss',maxCombo:'Combo max',maxBoss:'Boss max',chipsTotal:'Chips total',won:'Victoires'}
  };
  const stTxt=k=>((STATTR[lang]&&STATTR[lang][k])||STATTR.en[k]||k);
  let achToasts=[];
  function unlockSkin(id){ meta.skins=meta.skins||{}; if(!meta.skins[id]){ meta.skins[id]=1; saveMeta(); } } // Phase 2
  function unlockAch(id){ if(meta.ach&&meta.ach[id]) return; meta.ach=meta.ach||{}; meta.ach[id]=1; saveMeta();
    achToasts.push({id,t:3.4}); try{ beep(880,0.09,'square',0.18); setTimeout(()=>beep(1320,0.12,'square',0.2),100); }catch(e){} vibe([20,30,20]);
    if(id==='won') unlockSkin('gold'); if(id==='mega') unlockSkin('toxic'); if(id==='madness') unlockSkin('glitch'); }
  function checkComboAch(m){ if(m>=10)unlockAch('combo10'); if(m>=20)unlockAch('combo20'); if(m>=30)unlockAch('combo30'); }
  let elapsed, spawnT, orbT, powerupT, difficulty, shake, flash, flashColor, nearGlow, nearCount, deathFlash=0;
  let deathT=0, deathX=0, deathY=0, deathGather=false, deathGlow='#ff7a1a', deathMsg='';   // Abgang: Timer + Loser-Materialisierung + Spott-Nachricht
  let level, levelTimer, levelDuration, unlocked, nextUpgradeAt, upStep;
  let bossActive, bossTimer, bossPhaseT, bossNumber, laserSpawnT;
  let banner, effects, shields, invuln, mods, upgradeCounts, lives, commentT, egg67done, egg67T;
  let comboTime=0, comboTimeMax=3.4;                 // Combo-Decay-Timer
  let beatIdx=0, beatPulse=0, spawnQueued=false, orbQueued=false; // Beat-Sync
  let daily=false;                                    // Daily-Challenge aktiv?
  let director=0.5, overdrive=false;                  // DDA + Combo-Overdrive
  let endless=false, madness=0, wonThisRun=false, laserFinal=false; // Finale + Wahnsinn-Modus
  let runOrbs=0, runPerfect=0, runBosses=0, madnessTime=0, runMaxMult=1;  // Statistik pro Run
  let runChipsPaid=0;   // Chips aus stillem Score-Trickle (Backbone-Ökonomie)
  let runChipsEarned=0; // Chips aus sichtbaren Events (Orbs/Combos/Boss) – Dopamin-Quelle
  let shipSeed=1;                                      // Stil-Seed des Spieler-Raumschiffs
  let shipSprite=null, shipSig='';                     // gebackener Pixel-Sprite + Signatur
  let opt=loadOpt();                                  // Einstellungen (Screenshake/Effekte/Flüche)
  function loadOpt(){ try{ const r=JSON.parse(localStorage.getItem('neondrift_opt')); if(r&&typeof r==='object') return {shake:r.shake==null?1:r.shake,fx:r.fx==null?1:r.fx,curses:r.curses==null?true:r.curses,guns:r.guns==null?true:r.guns,dmg:r.dmg==null?true:r.dmg,dailyShop:r.dailyShop==null?true:r.dailyShop}; }catch(e){} return {shake:1,fx:1,curses:true,guns:true,dmg:true,dailyShop:true}; }
  function saveOpt(){ try{ localStorage.setItem('neondrift_opt',JSON.stringify(opt)); }catch(e){} }

  // ---------- Audio ----------
  let actx=null, muted=false, masterGain=null, musicGain=null, musicDelay=null, vibLFO=null, vibGain=null;
  let analyser=null, waveData=null;   // Audio-Abgriff für den Sonnen-Visualizer (Wellenform der Musik)
  function ensureCtx(){
    if(actx) return true;
    try{ actx=new (window.AudioContext||window.webkitAudioContext)();
      masterGain=actx.createGain(); masterGain.gain.value=0.9; masterGain.connect(actx.destination);
      musicGain=actx.createGain(); musicGain.gain.value=0.42; musicGain.connect(masterGain);
      analyser=actx.createAnalyser(); analyser.fftSize=256; analyser.smoothingTimeConstant=0.6; musicGain.connect(analyser); // Seiten-Abgriff (Wellenform), kein Audio-Ausgang
      waveData=new Uint8Array(analyser.fftSize);
      // Synthwave-Echo-Bus (tempo-naher Delay mit dunklem Feedback) → Tiefe statt trockener Sound. Dezent gehalten, sonst „hallig/verwaschen".
      musicDelay=actx.createDelay(1.2); musicDelay.delayTime.value=0.315;
      const dfb=actx.createGain(); dfb.gain.value=0.27;
      const dlp=actx.createBiquadFilter(); dlp.type='lowpass'; dlp.frequency.value=2600;
      const dwet=actx.createGain(); dwet.gain.value=0.45;
      musicDelay.connect(dlp); dlp.connect(dfb); dfb.connect(musicDelay); musicDelay.connect(dwet); dwet.connect(masterGain);
      // Vibrato-LFO für die Lead-Stimmen (leichtes Leben/Chorus)
      vibLFO=actx.createOscillator(); vibLFO.type='sine'; vibLFO.frequency.value=5.2;
      vibGain=actx.createGain(); vibGain.gain.value=5.5; vibLFO.connect(vibGain); vibLFO.start();
      return true;
    }catch(e){ actx=null; return false; }
  }
  function unlockAudio(){
    if(!ensureCtx()) return;
    try{ if(actx.state==='suspended') actx.resume();
      const b=actx.createBuffer(1,1,22050), s=actx.createBufferSource(); s.buffer=b; s.connect(actx.destination); s.start(0);
    }catch(e){}
    if(!muted) startMusic();
    const sh=document.getElementById('soundHint'); if(sh) sh.style.display='none';   // Hinweis nach erster Geste entfernen
  }
  ['pointerdown','touchstart','mousedown','keydown','click'].forEach(ev=>window.addEventListener(ev,unlockAudio,{passive:true}));

  function beep(freq,dur,type='sine',vol=0.4,slide=0){
    if(!actx||muted) return;
    try{ const o=actx.createOscillator(), g=actx.createGain();
      o.type=type; o.frequency.setValueAtTime(Math.max(20,freq),actx.currentTime);
      if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),actx.currentTime+dur);
      g.gain.setValueAtTime(vol,actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+dur);
      o.connect(g); g.connect(masterGain); o.start(); o.stop(actx.currentTime+dur);
    }catch(e){}
  }
  const sfxOrb=c=>{ if(sfxGate('orb',45)) beep(440+Math.min(c,20)*40,0.12,'triangle',0.32); };
  const sfxNear=()=>{ if(sfxGate('near',70)) beep(900,0.07,'sine',0.18,400); };
  const sfxStart=()=>{beep(523,0.09,'square',0.3);setTimeout(()=>beep(784,0.12,'square',0.3),90);};
  function sfxCrash(){beep(180,0.5,'sawtooth',0.5,-140);beep(90,0.6,'square',0.4,-50);}
  function duckMusic(dur){ if(!musicGain||!actx) return; const t=actx.currentTime;
    musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value,t);
    musicGain.gain.linearRampToValueAtTime(0.06,t+0.08); musicGain.gain.linearRampToValueAtTime(0.42,t+dur); }
  function sfxGameOver(){ if(!actx||muted) return;
    beep(160,0.45,'sawtooth',0.5,-90);                 // Crash-Boom
    beep(70,0.55,'square',0.4,-25);
    const notes=[[466,160],[415,440],[392,720],[294,1040]]; // absteigend: "wah wah wah waaah"
    notes.forEach(([f,delay],i)=>{ const last=i===notes.length-1;
      setTimeout(()=>{ beep(f,last?0.7:0.34,'sawtooth',0.42,-22); beep(f*0.5,last?0.7:0.34,'square',0.16,-12); }, delay); });
    setTimeout(()=>{ beep(98,0.7,'square',0.4,-40); beep(196,0.7,'triangle',0.18,-30); },1340); // tiefer Schluss-Thud
  }
  function sfxBoss(){beep(140,0.25,'square',0.4,120);beep(70,0.4,'sawtooth',0.35,40);}
  function sfxLaugh(){ [0,120,235,345,450].forEach((d,i)=>setTimeout(()=>{ const f=300-i*22; beep(f,0.10,'square',0.22,-50); beep(f*0.5,0.10,'triangle',0.13,-25); },d)); } // höhnisches „ha-ha-ha"
  function sfxWin(){beep(523,0.12,'triangle',0.4);setTimeout(()=>beep(784,0.18,'triangle',0.4),110);}
  const sfxWarn=()=>beep(760,0.05,'square',0.12);
  const sfxFire=()=>beep(120,0.35,'sawtooth',0.4,-50);
  const sfxPow=()=>{beep(660,0.08,'square',0.3);setTimeout(()=>beep(990,0.12,'square',0.3),70);};
  const sfxLevel=()=>{beep(523,0.08,'square',0.3);setTimeout(()=>beep(659,0.08,'square',0.3),80);setTimeout(()=>beep(880,0.14,'square',0.3),160);};
  const sfxShieldBreak=()=>beep(300,0.25,'sawtooth',0.35,-150);
  const sfxUpgrade=()=>{beep(440,0.1,'triangle',0.3);setTimeout(()=>beep(660,0.1,'triangle',0.3),90);setTimeout(()=>beep(880,0.16,'triangle',0.35),180);};
  let shootTick=0;
  // SFX-Drossel: begrenzt die Wiederholrate eines Sounds (gegen „Rauschwand" bei hoher Schuss-/Killfrequenz im Endgame)
  const _sfxT={}; function sfxGate(key,ms){ const n=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now(); if(n-(_sfxT[key]||0)<ms) return false; _sfxT[key]=n; return true; }
  function sfxShoot(){ if(!sfxGate('shoot',58)) return; shootTick^=1; const lp=Math.min(300,((level||1)-1)*11); beep(shootTick?900+lp:980+lp,0.03,'square',0.06,260); } // gedrosselt (~17/s); Tonhöhe steigt mit Level = Eskalations-Gefühl
  function sfxKill(){ if(!sfxGate('kill',50)) return; beep(360,0.12,'square',0.2,-180); beep(140,0.18,'sawtooth',0.16,-60); } // gedrosselt (~20/s)
  // ---- Boss-Tod-Sounds (je nach Abgangs-Animation) ----
  function sfxBoom(){ beep(120,0.55,'square',0.5,-80); beep(60,0.7,'sawtooth',0.42,-34); beep(220,0.3,'triangle',0.3,-160);
    for(let i=0;i<5;i++) setTimeout(()=>beep(rand(80,260),0.06,'square',0.18,-rand(20,90)),i*22); } // Donner + Geprassel
  // Riesen-Explosion zum Game-Over: tiefer, langer Nuklear-Rumms + Nachhall
  function sfxDeathBlast(p){ p=p||1; beep(95*p,0.9,'sawtooth',0.5,-80); beep(46*p,1.15,'square',0.46,-28); beep(210*p,0.5,'triangle',0.36,-250);
    setTimeout(()=>beep(150*p,0.45,'triangle',0.3,-200),80); setTimeout(()=>beep(64*p,0.75,'sawtooth',0.42,-44),150); setTimeout(()=>beep(38*p,0.85,'sine',0.36,-20),320);
    for(let i=0;i<9;i++) setTimeout(()=>beep(rand(70,300),0.06,'square',0.2,-rand(30,120)),i*28); }   // langes Geprassel/Funken (Pitch p variiert)
  function sfxMaterialize(){ beep(150,0.5,'sine',0.16,1000); setTimeout(()=>beep(320,0.3,'triangle',0.14,640),120); setTimeout(()=>beep(880,0.12,'square',0.13,180),370); }   // aufsteigender Re-Assemble-Sweep + Ping
  function sfxBloat(){ beep(180,1.0,'sawtooth',0.26,520); beep(360,1.0,'square',0.12,1040);            // ansteigendes Aufpump-Pfeifen
    for(let i=0;i<6;i++) setTimeout(()=>beep(300+i*70,0.05,'triangle',0.12),i*180); }
  function sfxBalloonPop(){ beep(1300,0.04,'square',0.32,-1000); beep(420,0.14,'sawtooth',0.34,-260);   // Knall
    beep(170,0.2,'square',0.26,-90); for(let i=0;i<4;i++) setTimeout(()=>beep(rand(200,600),0.05,'square',0.16,-rand(80,200)),i*18); } // Splatter
  function sfxMeltdown(){ for(let i=0;i<10;i++) setTimeout(()=>beep(rand(700,2200),0.04,'square',0.14,-rand(100,400)),i*70); // E-Knistern
    setTimeout(()=>{ beep(400,0.6,'sawtooth',0.34,-360); beep(120,0.7,'square',0.3,-70); },720); }      // Power-Down
  function sfxImplode(){ beep(900,0.55,'sine',0.32,-760); beep(1300,0.5,'triangle',0.18,-1000);          // einsaugendes Vwoop
    setTimeout(()=>{ beep(1800,0.1,'triangle',0.32,200); beep(120,0.4,'square',0.34,-50); },560); }      // Ping + Bass-Hit

  // ---------- Chiptune-Engine (Original-Komposition, loopt in Variationen) ----------
  const BPM=142;
  let musicOn=false, schedTimer=null, step16=0, nextStepTime=0, loopCount=0, secPerStep=60/(BPM*4);
  let musicShift=0;                                  // globale Transposition (pro Level andere Tonart)
  const midiF=n=>440*Math.pow(2,(n-69+musicShift)/12);
  const levelKey=lv=>{ let s=((Math.max(1,lv)-1)*5)%12; if(s>6) s-=12; return s; };  // Quartenzirkel, ±6 Halbtöne → jedes Level klar andere Tonart
  // Lead A – PROLOG: eigenständige Melodie, die den Stufengang-Bogen von „Ode an die Freude" nur ANDEUTET (nicht kopiert)
  const LEAD1=[
    {s:0,n:72,d:2},{s:2,n:76,d:2},{s:4,n:77,d:1},{s:5,n:79,d:1},{s:6,n:79,d:2},{s:8,n:77,d:2},{s:10,n:76,d:2},{s:12,n:74,d:4},
    {s:16,n:79,d:2},{s:18,n:77,d:2},{s:20,n:76,d:2},{s:22,n:74,d:2},{s:24,n:72,d:2},{s:26,n:74,d:2},{s:28,n:71,d:4},
    {s:32,n:72,d:2},{s:34,n:76,d:2},{s:36,n:81,d:2},{s:38,n:79,d:1},{s:39,n:77,d:1},{s:40,n:76,d:2},{s:42,n:72,d:2},{s:44,n:69,d:4},
    {s:48,n:72,d:2},{s:50,n:76,d:2},{s:52,n:79,d:2},{s:54,n:77,d:1},{s:55,n:76,d:1},{s:56,n:74,d:2},{s:58,n:71,d:2},{s:60,n:72,d:4}
  ];
  const LEAD2=[
    {s:0,n:84,d:2},{s:2,n:83,d:2},{s:4,n:79,d:2},{s:6,n:76,d:2},{s:8,n:77,d:2},{s:10,n:79,d:2},{s:12,n:84,d:4},
    {s:16,n:83,d:2},{s:18,n:79,d:2},{s:20,n:74,d:2},{s:22,n:79,d:2},{s:24,n:83,d:2},{s:26,n:79,d:1},{s:27,n:77,d:1},{s:28,n:74,d:4},
    {s:32,n:81,d:2},{s:34,n:84,d:2},{s:36,n:88,d:2},{s:38,n:84,d:1},{s:39,n:81,d:1},{s:40,n:79,d:2},{s:42,n:76,d:2},{s:44,n:72,d:4},
    {s:48,n:79,d:2},{s:50,n:84,d:2},{s:52,n:88,d:2},{s:54,n:84,d:1},{s:55,n:79,d:1},{s:56,n:76,d:2},{s:58,n:74,d:2},{s:60,n:72,d:4}
  ];
  // Lead B – NACHTFAHRT: eigenständig, der Korobeiniki-(Tetris-)Quintsprung als Auftakt-Zelle, danach neu & durchgedreht
  const LEADB1=[
    {s:0,n:74,d:2},{s:2,n:72,d:2},{s:4,n:70,d:1},{s:5,n:69,d:1},{s:6,n:77,d:2},{s:8,n:76,d:2},{s:10,n:74,d:2},{s:12,n:72,d:4},
    {s:16,n:70,d:2},{s:18,n:74,d:2},{s:20,n:77,d:2},{s:22,n:79,d:1},{s:23,n:77,d:1},{s:24,n:74,d:2},{s:26,n:70,d:2},{s:28,n:67,d:4},
    {s:32,n:69,d:2},{s:34,n:72,d:2},{s:36,n:76,d:2},{s:38,n:74,d:1},{s:39,n:72,d:1},{s:40,n:69,d:2},{s:42,n:67,d:2},{s:44,n:64,d:4},
    {s:48,n:70,d:2},{s:50,n:67,d:2},{s:52,n:74,d:2},{s:54,n:72,d:1},{s:55,n:70,d:1},{s:56,n:69,d:2},{s:58,n:67,d:2},{s:60,n:74,d:4}
  ];
  const LEADB2=[
    {s:0,n:81,d:2},{s:2,n:74,d:2},{s:4,n:77,d:1},{s:5,n:79,d:1},{s:6,n:81,d:2},{s:8,n:79,d:2},{s:10,n:77,d:2},{s:12,n:74,d:4},
    {s:16,n:74,d:2},{s:18,n:77,d:2},{s:20,n:82,d:2},{s:22,n:79,d:2},{s:24,n:77,d:2},{s:26,n:74,d:2},{s:28,n:70,d:4},
    {s:32,n:76,d:2},{s:34,n:81,d:2},{s:36,n:84,d:2},{s:38,n:81,d:1},{s:39,n:79,d:1},{s:40,n:76,d:2},{s:42,n:72,d:2},{s:44,n:69,d:4},
    {s:48,n:74,d:2},{s:50,n:79,d:2},{s:52,n:82,d:2},{s:54,n:79,d:1},{s:55,n:77,d:1},{s:56,n:74,d:2},{s:58,n:70,d:2},{s:60,n:62,d:4}
  ];
  // Lead C – ÜBERTAKTET (A-Dur, hoch, hektisch 16tel)
  const LEADC1=[
    {s:0,n:81,d:1},{s:1,n:80,d:1},{s:2,n:78,d:1},{s:3,n:76,d:1},{s:4,n:73,d:2},{s:6,n:76,d:2},{s:8,n:81,d:1},{s:9,n:78,d:1},
    {s:10,n:76,d:1},{s:11,n:73,d:1},{s:12,n:69,d:4},{s:16,n:80,d:1},{s:17,n:76,d:1},{s:18,n:73,d:2},{s:20,n:68,d:2},{s:22,n:71,d:2},
    {s:24,n:76,d:1},{s:25,n:73,d:1},{s:26,n:68,d:2},{s:28,n:64,d:4},{s:32,n:78,d:1},{s:33,n:74,d:1},{s:34,n:69,d:2},{s:36,n:73,d:2},
    {s:38,n:78,d:2},{s:40,n:81,d:1},{s:41,n:78,d:1},{s:42,n:74,d:2},{s:44,n:69,d:4},{s:48,n:74,d:1},{s:49,n:78,d:1},{s:50,n:81,d:2},
    {s:52,n:85,d:2},{s:54,n:81,d:2},{s:56,n:78,d:1},{s:57,n:74,d:1},{s:58,n:69,d:2},{s:60,n:73,d:4}
  ];
  const LEADC2=[
    {s:0,n:85,d:1},{s:1,n:81,d:1},{s:2,n:78,d:2},{s:4,n:76,d:1},{s:5,n:73,d:1},{s:6,n:69,d:2},{s:8,n:73,d:1},{s:9,n:76,d:1},
    {s:10,n:78,d:1},{s:11,n:81,d:1},{s:12,n:85,d:4},{s:16,n:83,d:1},{s:17,n:80,d:1},{s:18,n:76,d:2},{s:20,n:71,d:2},{s:22,n:68,d:2},
    {s:24,n:71,d:1},{s:25,n:76,d:1},{s:26,n:80,d:2},{s:28,n:76,d:4},{s:32,n:81,d:1},{s:33,n:78,d:1},{s:34,n:73,d:2},{s:36,n:69,d:2},
    {s:38,n:73,d:2},{s:40,n:78,d:1},{s:41,n:81,d:1},{s:42,n:85,d:2},{s:44,n:90,d:4},{s:48,n:86,d:1},{s:49,n:81,d:1},{s:50,n:78,d:2},
    {s:52,n:74,d:2},{s:54,n:69,d:2},{s:56,n:73,d:1},{s:57,n:78,d:1},{s:58,n:81,d:2},{s:60,n:69,d:4}
  ];
  // Lead D – STRATOSPHÄRE (G-Dur, hell & hymnisch, treibender Achtel-Bass)
  const LEADD1=[
    {s:0,n:79,d:2},{s:2,n:74,d:2},{s:4,n:71,d:2},{s:6,n:74,d:1},{s:7,n:76,d:1},{s:8,n:79,d:2},{s:10,n:83,d:2},{s:12,n:79,d:4},
    {s:16,n:78,d:2},{s:18,n:74,d:2},{s:20,n:71,d:2},{s:22,n:69,d:2},{s:24,n:74,d:2},{s:26,n:78,d:1},{s:27,n:81,d:1},{s:28,n:74,d:4},
    {s:32,n:76,d:2},{s:34,n:79,d:2},{s:36,n:83,d:2},{s:38,n:79,d:1},{s:39,n:76,d:1},{s:40,n:74,d:2},{s:42,n:71,d:2},{s:44,n:67,d:4},
    {s:48,n:72,d:2},{s:50,n:76,d:2},{s:52,n:79,d:2},{s:54,n:76,d:1},{s:55,n:72,d:1},{s:56,n:74,d:2},{s:58,n:79,d:2},{s:60,n:79,d:4}
  ];
  const LEADD2=[
    {s:0,n:86,d:2},{s:2,n:83,d:2},{s:4,n:79,d:2},{s:6,n:74,d:2},{s:8,n:79,d:1},{s:9,n:83,d:1},{s:10,n:86,d:2},{s:12,n:91,d:4},
    {s:16,n:90,d:2},{s:18,n:86,d:2},{s:20,n:81,d:2},{s:22,n:78,d:2},{s:24,n:81,d:2},{s:26,n:86,d:1},{s:27,n:90,d:1},{s:28,n:81,d:4},
    {s:32,n:83,d:2},{s:34,n:79,d:2},{s:36,n:76,d:2},{s:38,n:71,d:2},{s:40,n:76,d:1},{s:41,n:79,d:1},{s:42,n:83,d:2},{s:44,n:88,d:4},
    {s:48,n:84,d:2},{s:50,n:79,d:2},{s:52,n:76,d:2},{s:54,n:72,d:2},{s:56,n:79,d:2},{s:58,n:83,d:1},{s:59,n:86,d:1},{s:60,n:79,d:4}
  ];
  // Lead E – ARKADE (A-Moll, eingängiger Chiptune-Ohrwurm, treibend)
  const LEADE1=[
    {s:0,n:81,d:2},{s:2,n:84,d:2},{s:4,n:83,d:1},{s:5,n:81,d:1},{s:6,n:79,d:1},{s:7,n:77,d:1},{s:8,n:76,d:2},{s:10,n:72,d:2},{s:12,n:69,d:4},
    {s:16,n:79,d:2},{s:18,n:83,d:2},{s:20,n:86,d:2},{s:22,n:83,d:1},{s:23,n:79,d:1},{s:24,n:77,d:2},{s:26,n:74,d:2},{s:28,n:71,d:4},
    {s:32,n:77,d:2},{s:34,n:81,d:2},{s:36,n:84,d:2},{s:38,n:81,d:1},{s:39,n:77,d:1},{s:40,n:76,d:2},{s:42,n:72,d:2},{s:44,n:69,d:4},
    {s:48,n:74,d:2},{s:50,n:79,d:2},{s:52,n:83,d:2},{s:54,n:79,d:1},{s:55,n:76,d:1},{s:56,n:74,d:2},{s:58,n:71,d:2},{s:60,n:67,d:4}
  ];
  const LEADE2=[
    {s:0,n:84,d:2},{s:2,n:81,d:2},{s:4,n:76,d:2},{s:6,n:72,d:2},{s:8,n:76,d:1},{s:9,n:81,d:1},{s:10,n:84,d:2},{s:12,n:88,d:4},
    {s:16,n:86,d:2},{s:18,n:83,d:2},{s:20,n:79,d:2},{s:22,n:74,d:2},{s:24,n:79,d:2},{s:26,n:83,d:1},{s:27,n:86,d:1},{s:28,n:79,d:4},
    {s:32,n:84,d:2},{s:34,n:81,d:2},{s:36,n:77,d:2},{s:38,n:72,d:2},{s:40,n:77,d:1},{s:41,n:81,d:1},{s:42,n:84,d:2},{s:44,n:89,d:4},
    {s:48,n:86,d:2},{s:50,n:83,d:2},{s:52,n:79,d:2},{s:54,n:76,d:2},{s:56,n:79,d:2},{s:58,n:76,d:1},{s:59,n:79,d:1},{s:60,n:81,d:4}
  ];
  // Menü-Lead – NEON CHILL (C-Dur, träumerisch, viel Raum, lange Töne)
  const LEADM1=[
    {s:0,n:72,d:6},{s:6,n:76,d:6},{s:12,n:74,d:4},
    {s:16,n:72,d:6},{s:22,n:69,d:6},{s:28,n:71,d:4},
    {s:32,n:69,d:6},{s:38,n:72,d:6},{s:44,n:74,d:4},
    {s:48,n:74,d:4},{s:52,n:71,d:4},{s:56,n:67,d:8}
  ];
  const LEADM2=[
    {s:0,n:79,d:4},{s:4,n:76,d:4},{s:8,n:72,d:4},{s:12,n:74,d:4},
    {s:16,n:76,d:4},{s:20,n:72,d:4},{s:24,n:69,d:4},{s:28,n:67,d:4},
    {s:32,n:72,d:4},{s:36,n:76,d:4},{s:40,n:79,d:6},{s:46,n:77,d:2},
    {s:48,n:76,d:6},{s:54,n:72,d:4},{s:58,n:71,d:6}
  ];
  const SONGS=[
    {name:'PROLOG',     lead1:LEAD1,  lead2:LEAD2,  bass:[36,43,45,36], chords:[[60,64,67],[55,59,62],[57,60,64],[60,64,67]], lt:'p50', leadVol:0.17, bassEighths:false, fourFloor:false, hatEvery:2},
    {name:'NACHTFAHRT', lead1:LEADB1, lead2:LEADB2, bass:[38,43,45,43], chords:[[62,65,69],[58,62,67],[57,60,64],[58,62,67]], lt:'p25', leadVol:0.13, bassEighths:true,  fourFloor:false, hatEvery:4},
    {name:'ÜBERTAKTET', lead1:LEADC1, lead2:LEADC2, bass:[45,40,42,38], chords:[[57,61,64],[52,56,59],[54,57,61],[50,54,57]], lt:'p12', leadVol:0.15, bassEighths:false, fourFloor:true,  hatEvery:1},
    {name:'STRATOSPHÄRE',lead1:LEADD1, lead2:LEADD2, bass:[43,38,40,36], chords:[[55,59,62],[50,54,57],[52,55,59],[48,52,55]], lt:'p25', leadVol:0.13, bassEighths:true,  fourFloor:false, hatEvery:2},
    {name:'ARKADE',     lead1:LEADE1, lead2:LEADE2, bass:[45,43,41,43], chords:[[57,60,64],[55,59,62],[53,57,60],[55,59,62]], lt:'p25', leadVol:0.15, bassEighths:true,  fourFloor:true,  hatEvery:2}
  ];
  // Eigener, entspannter Menü-Track (rotiert NICHT mit den Level-Songs)
  const MENU_SONG={name:'NEON CHILL', lead1:LEADM1, lead2:LEADM2, bass:[36,45,41,43],
    chords:[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]], lt:'triangle', leadVol:0.135, chill:true};
  let curSong=0, pendingSong=-1;   // pendingSong: gewählter Folge-Song, wird erst an einer ruhigen Stelle (Intro/Verse) eingeblendet → schleichend
  // ---- Game-Boy-Pulswellen (Tastverhältnis) ----
  // Der GB/NES-Soundchip hat keine echte Säge, sondern Pulskanäle mit 12,5%/25%/50% Duty –
  // genau dieser dünne, nasale Ton macht den „Game-Boy"-Charakter. Wir bauen ihn per Fourierreihe.
  const PULSE={};
  function pulseWave(duty){ const k=duty.toFixed(2); if(PULSE[k]) return PULSE[k];
    const N=22, real=new Float32Array(N), imag=new Float32Array(N);
    for(let n=1;n<N;n++) real[n]=(2/(n*Math.PI))*Math.sin(n*Math.PI*duty);   // Amplitudenspektrum eines Duty-Pulses
    const w=actx.createPeriodicWave(real,imag); PULSE[k]=w; return w; }
  // type 'p12'/'p25'/'p50' → Pulswelle mit 12/25/50% Duty, sonst Standard-Wellenform
  function setOsc(o,type){ if(type&&type[0]==='p') o.setPeriodicWave(pulseWave((+type.slice(1))/100)); else o.type=type; }
  // Songform (gilt für alle Level-Songs): Intro baut auf · Verse atmet · Chorus episch · Bridge = Quarte hoch
  // Songform mit Dramaturgie: Strophe (Melodie vorn) → Steigerung → Drop (Dubstep-Wucht) → Chorus → Bridge → Steigerung → Drop
  const FORM=[{p:1,m:'intro'},{p:1,m:'verse'},{p:2,m:'verse'},{p:2,m:'build'},
              {p:1,m:'drop'},{p:1,m:'chorus'},{p:2,m:'bridge'},{p:2,m:'build'},{p:1,m:'drop'},{p:2,m:'chorus'}];
  function mVoice(time,freq,dur,type,vol,atk=0.005){
    const o=actx.createOscillator(), g=actx.createGain();
    setOsc(o,type); o.frequency.setValueAtTime(freq,time);
    g.gain.setValueAtTime(0.0001,time); g.gain.linearRampToValueAtTime(vol,time+atk);
    g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    o.connect(g); g.connect(musicGain); o.start(time); o.stop(time+dur+0.02);
  }
  // Fette Lead-Stimme: 2 leicht verstimmte Oszis (Chorus) + Sub-Oktave + Tiefpass-Sweep + Vibrato + Echo-Send
  function mLead(time,freq,dur,type,vol,echo){
    const g=actx.createGain();
    g.gain.setValueAtTime(0.0001,time); g.gain.linearRampToValueAtTime(vol,time+0.014);
    g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=0.9;
    lp.frequency.setValueAtTime(Math.min(9000,freq*5),time);
    lp.frequency.linearRampToValueAtTime(Math.min(5200,freq*2.6),time+dur);
    lp.connect(g); g.connect(musicGain);
    if(echo&&musicDelay){ const s=actx.createGain(); s.gain.value=echo; g.connect(s); s.connect(musicDelay); }
    for(const c of [-6,6]){ const o=actx.createOscillator(); setOsc(o,type); o.frequency.setValueAtTime(freq,time); o.detune.setValueAtTime(c,time);
      if(vibGain) vibGain.connect(o.detune); o.connect(lp); o.start(time); o.stop(time+dur+0.03); }
    const sub=actx.createOscillator(); sub.type='triangle'; sub.frequency.setValueAtTime(freq/2,time);
    const sg=actx.createGain(); sg.gain.value=0.32; sub.connect(sg); sg.connect(lp); sub.start(time); sub.stop(time+dur+0.03);
  }
  function mNoise(time,dur,vol,hp){
    const len=Math.max(1,Math.floor(actx.sampleRate*dur));
    const buf=actx.createBuffer(1,len,actx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    const src=actx.createBufferSource(); src.buffer=buf;
    const f=actx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp||4000;
    const g=actx.createGain(); g.gain.setValueAtTime(vol,time); g.gain.exponentialRampToValueAtTime(0.001,time+dur);
    src.connect(f); f.connect(g); g.connect(musicGain); src.start(time); src.stop(time+dur);
  }
  function mKick(time){
    const o=actx.createOscillator(), g=actx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(150,time); o.frequency.exponentialRampToValueAtTime(45,time+0.12);
    g.gain.setValueAtTime(0.55,time); g.gain.exponentialRampToValueAtTime(0.001,time+0.16);
    o.connect(g); g.connect(musicGain); o.start(time); o.stop(time+0.18);
  }
  // Prise Dubstep: Half-Time-Wobble-Sub (Säge+Sub durch resonanten Tiefpass, LFO moduliert die Cutoff = „Wob").
  // Bewusst die einzige Säge (= EDM-Schicht, kontrastiert den Chip-Lead) und nur auf der Chorus-Eins.
  function mWobble(time,freq,dur){
    const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=12; lp.frequency.setValueAtTime(480,time);
    const lfo=actx.createOscillator(); lfo.type='sine'; lfo.frequency.setValueAtTime(1/(secPerStep*2),time);   // achtelsynchroner Wobble
    const lg=actx.createGain(); lg.gain.value=900; lfo.connect(lg); lg.connect(lp.frequency);                  // tiefe Cutoff-Modulation = fetter Grind
    const g=actx.createGain(); g.gain.setValueAtTime(0.0001,time); g.gain.linearRampToValueAtTime(0.12,time+0.02);
    g.gain.setValueAtTime(0.12,time+dur*0.8); g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    const sub=actx.createOscillator(); sub.type='sine'; sub.frequency.setValueAtTime(freq/2,time); sub.connect(lp);
    const oscs=[sub];
    for(const det of [-9,9]){ const o=actx.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(freq,time); o.detune.setValueAtTime(det,time); o.connect(lp); oscs.push(o); } // 2 verstimmte Sägen = breit/grindig
    lp.connect(g); g.connect(musicGain);
    const end=time+dur+0.02; lfo.start(time); lfo.stop(end); for(const o of oscs){ o.start(time); o.stop(end); }
  }
  // Arcade-Laser „Pew": Puls mit schnellem Frequenz-Sweep (up=aufsteigend) → 80er-Spielhallen-Zap
  function mLaser(time,freq,dur,up,vol){
    const o=actx.createOscillator(); setOsc(o,'p25'); o.frequency.setValueAtTime(freq,time);
    o.frequency.exponentialRampToValueAtTime(Math.max(60, up?freq*2.8:freq/3.2), time+dur);
    const g=actx.createGain(); g.gain.setValueAtTime(0.0001,time); g.gain.linearRampToValueAtTime(vol||0.07,time+0.004); g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    o.connect(g); g.connect(musicGain);
    if(musicDelay){ const s=actx.createGain(); s.gain.value=0.35; g.connect(s); s.connect(musicDelay); }
    o.start(time); o.stop(time+dur+0.02);
  }
  // Heller, kurzer Arpeggio-/Twinkle-Ton mit Echo – Basis der prozeduralen Variation
  function mArp(time,freq,dur,vol){
    const o=actx.createOscillator(), g=actx.createGain();
    o.type='triangle'; o.frequency.setValueAtTime(freq,time);
    g.gain.setValueAtTime(0.0001,time); g.gain.linearRampToValueAtTime(vol,time+0.004);
    g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    o.connect(g); g.connect(musicGain);
    if(musicDelay){ const s=actx.createGain(); s.gain.value=0.4; g.connect(s); s.connect(musicDelay); }
    o.start(time); o.stop(time+dur+0.02);
  }
  function sfxRiser(){ if(!actx||muted) return; try{
    const o=actx.createOscillator(), g=actx.createGain(); o.type='sawtooth';
    o.frequency.setValueAtTime(180,actx.currentTime); o.frequency.exponentialRampToValueAtTime(1900,actx.currentTime+0.7);
    g.gain.setValueAtTime(0.0001,actx.currentTime); g.gain.linearRampToValueAtTime(0.22,actx.currentTime+0.55); g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+0.82);
    o.connect(g); g.connect(masterGain); o.start(); o.stop(actx.currentTime+0.85);
  }catch(e){} }
  function scheduleStep(step,time){
    const playing=(state!==S.MENU);
    musicShift=playing?levelKey(level||1):0;                                  // Tonart steigt pro Level
    secPerStep=60/((BPM+(playing?Math.min(((level||1)-1)*2,20):0))*4);        // Tempo zieht pro Level nur sanft an (bis +20 BPM) – nicht mehr zu krass
    const song=(state===S.MENU)?MENU_SONG:(SONGS[curSong]||SONGS[0]);
    const lv=song.leadVol||0.16, echo=song.chill?0.5:0.3;
    const block=Math.floor(step/16), ls=step%16;
    // ---- SONGFORM: echtes Arrangement statt 2-Phrasen-Loop (Intro→Verse→Chorus→Bridge→Chorus über 8 Loops) ----
    const sec=song.chill?{p:(loopCount%2)+1,m:'chill'}:FORM[loopCount%FORM.length];
    const lead=sec.p===2?song.lead2:song.lead1;
    const m=sec.m;
    const intro=m==='intro', verse=m==='verse', build=m==='build', drop=m==='drop', chorus=m==='chorus', bridge=m==='bridge';
    const big=drop||chorus;                           // volle Energie (Drop/Chorus)
    const kt=bridge?5:0;                              // Bridge: Melodie + Harmonie eine Quarte hoch = klar neues Songteil
    const root=song.bass[block]+kt;
    // ---- LEAD = Hauptmelodie klar VORN. Verse am lautesten; im Build läuft sie sanft aus (kein harter Schnitt → fließt) ----
    if(!build || step<32){ const lvol=build?lv*0.7*(1-step/32):(verse?lv*1.32:(big?lv*1.14:(intro?lv*0.82:lv)));
      for(const e of lead) if(e.s===step){ mLead(time,midiF(e.n+kt),e.d*secPerStep*0.94,song.lt,lvol,echo);
        if(big && e.d>=2) mVoice(time,midiF(e.n+kt+12),e.d*secPerStep*0.6,'p50',lv*0.3,0.012); } }   // Drop/Chorus: Oktav-Harmonie drauf
    if(song.chill){
      if(ls===0||ls===8) mVoice(time,midiF(root),secPerStep*5,'triangle',0.20,0.012);                 // weicher, ruhiger Bass
      if(ls===0){ for(const cn of song.chords[block]) mVoice(time,midiF(cn+12),secPerStep*15,'sine',0.03,0.06); } // sanfter Pad-Akkord
      if(ls===0||ls===8) mKick(time);                                                                  // entspannter Puls
      if(ls%4===2) mNoise(time,0.02,0.018,9000);                                                       // dezenter Shaker
      if((ls===6||ls===14) && loopCount%2===0){ const c=song.chords[block]; mArp(time,midiF(c[(ls/2)%c.length]+24),secPerStep*1.6,0.022); } // träumerische Sparkle
      return;
    }
    // ===== STEIGERUNG (Build): keine Melodie, Snare-Roll verdichtet sich + Riser steigt → Spannung vor dem Drop =====
    if(build){
      if(ls%4===0) mKick(time);                                                                        // treibender Four-on-the-floor
      const roll=step<32?8:step<48?4:step<56?2:1;                                                       // 8tel → 16tel → 32tel: immer dichter
      if(ls%roll===0) mNoise(time,0.05,0.05+0.16*(step/64),1700);                                       // Snare-Roll, lauter zum Ende
      mNoise(time,0.045,0.015+0.10*(step/64),900+step*60);                                              // Riser-Sweep (steigt durchgehend an)
      if(ls%2===0){ mVoice(time,midiF(root),secPerStep*1.4,'triangle',0.22,0.004);                       // durchlaufender Bass = Kontinuität (kein Totalausfall)
        const sc=song.chords[block]; mVoice(time,midiF(sc[(step/2)%sc.length]+12+(step>=48?12:0)),secPerStep*0.4,'p25',0.035,0.002); } // aufsteigender Chip-Riser
      return;
    }
    // ---- BASS (Drop/Chorus: NES-Oktav-Bounce · Intro sparsam) ----
    if(song.bassEighths && !intro){ if(ls%2===0) mVoice(time,midiF(root+((big&&ls%4===2)?12:0)),secPerStep*1.5,'triangle',big?0.30:0.24,0.004); } // treibender Achtel-Bass
    else { if(ls%4===0) mVoice(time,midiF(root),secPerStep*2,'triangle',big?0.33:(intro?0.2:0.27),0.004); else if(ls%4===2 && !intro) mVoice(time,midiF(root+7),secPerStep*1.4,'triangle',0.15); }
    // ---- DROP = Impact mit Wucht: Crash + Powerchord + EIN kurzer Wob + aufsteigende Arcade-Laser-Fanfare (weniger wawa!) ----
    if(drop && ls===0){ mNoise(time,0.32,0.11,2400); mWobble(time,midiF(root-12),secPerStep*5);             // dezenter Crash + EIN Wob
      for(let z=0;z<4;z++) mLaser(time+z*secPerStep*0.5,midiF(root+12+[0,4,7,12][z]),secPerStep*0.55,true,0.04); } // Laser-Fanfare hoch (dezenter)
    if(drop && ls===8) mLaser(time,midiF(root+24),secPerStep*1.3,false,0.05);                               // Abwärts-Laser-Zap statt 2. Wobble
    if(chorus && ls===0){ mNoise(time,0.22,0.085,3000); for(let z=0;z<3;z++) mLaser(time+z*secPerStep*0.4,midiF(root+19+z*5),secPerStep*0.42,true,0.035); } // Chorus: leise Laser-Fanfare statt Wobble
    if(big && (ls===6||ls===14)) mLaser(time,midiF(root+24+(ls===14?5:0)),secPerStep*0.9,false,0.03);        // dezente Laser-Akzente zwischendurch
    // ---- EPISCHE Power-Akkorde im Drop & Chorus ----
    if(big && (ls===0||ls===8)){ for(const n of [root,root+12,root+19,root+24]) mVoice(time,midiF(n),secPerStep*3.6,'p50',drop?0.085:0.07,0.012); }
    // ---- Chiptune-Arpeggio: im Drop/Chorus breit & laut + Trill-Wahnsinn, im Verse dezent (Melodie bleibt vorn), Intro aus ----
    if(!intro){ const ch=song.chords[block]; mVoice(time,midiF(ch[step%ch.length]+12+kt),secPerStep*0.42,'p12',big?0.075:0.038,0.001);
      if(big && ls%2===0) mVoice(time,midiF(ch[(step+2)%ch.length]+24+kt),secPerStep*0.3,'p12',0.05,0.001);      // 2. Oktave = breiter Chip-Sound
      if(big && ls%4===2){ for(const cn of ch) mVoice(time,midiF(cn+12+kt),secPerStep*0.5,'p25',0.03,0.002); }   // punchy Chip-Stab auf dem Backbeat
      if(big && (ls===14||ls===15)){ mVoice(time,midiF(ch[(step%2?0:2)%ch.length]+24+kt),secPerStep*0.22,'p12',0.05,0.001); } } // 16tel-Trill am Taktende = durchgedreht
    // ---- DRUMS: Intro = nur Eins · Drop/Chorus = Four-on-the-floor + fette Snare · Verse/Bridge = sparsam ----
    if(intro){ if(ls===0) mKick(time); }
    else if(big){ if(ls%4===0) mKick(time); } else { if(ls===0||ls===8) mKick(time); }
    if((ls===4||ls===12) && !intro) mNoise(time,0.12,big?0.20:0.13,1800);                               // Snare
    if(state===S.PLAY && !intro && ls%((song.hatEvery||2)*(big?1:2))===0) mNoise(time,0.025,big?0.06:0.04,8000); // Hats
    // ---- Sparkle-Arp-Schicht NUR in Drop/Chorus (Verse/Bridge bleiben für die Melodie frei) ----
    if(state===S.PLAY && big){ const ch=song.chords[block], V=loopCount;
      const dens=[2,2,4,2][V%4];
      if(ls%dens===0){ const pat=V%3, k=Math.floor(step/dens), seq=ch.length;
        const idx=pat===0?k%seq:pat===1?(seq-1-(k%seq)):[0,1,2,1][k%4]%seq;
        mArp(time,midiF(ch[idx]+12+kt+(V%4===1?12:0)),secPerStep*0.62,0.045); }
      if(step>=58){ const run=[0,2,1,3]; mArp(time,midiF(ch[run[(step-58)%4]%ch.length]+24+kt),secPerStep*0.42,0.05); }
    }
  }
  function scheduler(){
    if(!actx) return;
    if(nextStepTime < actx.currentTime) nextStepTime = actx.currentTime + 0.05; // Resync nach Tab-Wechsel
    while(nextStepTime < actx.currentTime+0.1){
      scheduleStep(step16,nextStepTime);
      nextStepTime+=secPerStep; step16++;
      if(step16>=64){ step16=0; loopCount++;
        // Schleichender Song-Wechsel: vorgemerkten Song nur einblenden, wenn der nächste Loop eine ruhige Sektion ist
        if(pendingSong>=0){ const nm=FORM[loopCount%FORM.length].m; if(nm==='intro'||nm==='verse'||nm==='bridge'){ curSong=pendingSong; pendingSong=-1; } } // mehr Wechsel-Fenster → weniger eintönig, trotzdem an ruhiger Stelle
      }
    }
  }
  function startMusic(){ if(!actx||musicOn) return; musicOn=true; step16=0; loopCount=0; nextStepTime=actx.currentTime+0.08; schedTimer=setInterval(scheduler,25); }

  // ---------- Haptik ----------
  function vibe(p){ if(navigator.vibrate){ try{ navigator.vibrate(p); }catch(e){} } }

  // ---------- Resize / Input ----------
  function resize(){ DPR=Math.min(window.devicePixelRatio||1,2);
    // An die tatsächliche #wrap-Größe (100dvh) koppeln, nicht an innerHeight –
    // sonst bleibt auf Mobil-Browsern unten ein heller Streifen in der Safe Area.
    const wrap=document.getElementById('wrap');
    W=wrap.clientWidth||window.innerWidth; H=wrap.clientHeight||window.innerHeight;
    canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.imageSmoothingEnabled=false; }   // Pixel-Sprites (Schiff/Boss) nearest-neighbor → scharfe Kanten statt verwaschen
  window.addEventListener('resize',resize); resize();
  function applyFx(){ const w=document.getElementById('wrap'); if(w) w.classList.toggle('crt',!!opt.fx); }   // CRT-Scanlines an/aus (CSS, koppelt an „Effekte")
  applyFx();
  const tgt={x:W/2,y:H*0.72};
  function setT(x,y){ if(mods&&mods.invertX) x=W-x; tgt.x=x; tgt.y=y; }   // Spiegelwelt-Fluch
  function onMove(e){ const r=canvas.getBoundingClientRect();
    if(e.touches&&e.touches[0]) setT(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); else setT(e.clientX-r.left,e.clientY-r.top); }
  canvas.addEventListener('mousemove',onMove);
  canvas.addEventListener('touchstart',e=>{onMove(e);e.preventDefault();},{passive:false});
  canvas.addEventListener('touchmove',e=>{onMove(e);e.preventDefault();},{passive:false});

  function makeStars(){ stars=[]; for(let i=0;i<70;i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()*0.7+0.3,r:Math.random()*1.6+0.4}); }
  makeStars();
  const rand=(a,b)=>a+Math.random()*(b-a);
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  // ---------- Seeded RNG (Daily-Runs: deterministische Hindernis-DNA) ----------
  let useSeed=false, seedState=0;
  function mulberry32(){ seedState=(seedState+0x6D2B79F5)|0; let t=seedState;
    t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }
  const grnd=()=> useSeed?mulberry32():Math.random();   // nur für layout-relevante Zufälle
  const grand=(a,b)=>a+grnd()*(b-a);
  const gpick=a=>a[Math.floor(grnd()*a.length)];
  function dailySeed(){ const d=new Date(); return ((d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())>>>0)||1; }
  function dailyLabel(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
  // ---- Partikel-Pool (Ring-Buffer) ----
  // Statt pro Treffer neue {}-Objekte zu erzeugen und per splice zu loeschen (→ GC-Ruckler bei
  // partikelstarken Waffen), werden PMAX Objekte EINMAL angelegt und danach nur recycelt.
  // emit() ueberschreibt das aelteste Slot → automatischer Cap, keine Allokation, kein splice.
  const PMAX=320; let pHead=0, pAlive=0;
  function initParticlePool(){ particles=[]; for(let i=0;i<PMAX;i++) particles.push({x:0,y:0,vx:0,vy:0,life:0,decay:0,color:'#fff',size:0}); pHead=0; }
  initParticlePool();   // einmalig: Pool fuellen, danach nie wieder neu allokieren
  function emitP(x,y,vx,vy,decay,color,size){ const p=particles[pHead]; pHead=(pHead+1)%PMAX;
    p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.life=1;p.decay=decay;p.color=color;p.size=size; }
  function clearParticles(){ for(let i=0;i<particles.length;i++) particles[i].life=0; pHead=0; }
  function spawnParticles(x,y,color,n,spd){ n=Math.max(1,Math.round(n*fxQ)); for(let i=0;i<n;i++){const a=Math.random()*6.28,s=rand(spd*0.3,spd);   // fxQ: bei Lag weniger Partikel erzeugen
    emitP(x,y,Math.cos(a)*s,Math.sin(a)*s,rand(0.012,0.03),color,rand(2,5));} }
  function floatText(x,y,text,color,size){ floaters.push({x,y,text,color:color||'#fff',size:size||16,life:1,vy:-42}); }
  // Schadenszahl (weiß = normal, rot = Krit). Mit Soft-Cap gegen Spam & nur wenn aktiviert.
  function floatDamage(x,y,amt,crit){ if(!opt.dmg||floaters.length>66) return; const a=Math.round(amt); if(a<=0) return;
    floaters.push({x:x+rand(-5,5),y,text:crit?(a+'!'):''+a,color:crit?'#ff3b3b':'#ffffff',size:crit?20:13,life:1,vy:-58,vx:rand(-14,14),dr:crit?1.25:1.8}); }
  function hexA(h,a){ const n=parseInt(h.slice(1),16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
  // Glow-Sprite-Cache: vorgerenderter Radial-Glow je Farbe. Additiv per drawImage gezeichnet ersetzt
  // den teuren ctx.shadowBlur pro Objekt (mobil der Haupt-Flaschenhals bei vielen Bolzen/Kugeln/Gegnern).
  const _glow={};
  function glowSprite(col){ let c=_glow[col]; if(c) return c;
    const sz=64; c=document.createElement('canvas'); c.width=c.height=sz; const g=c.getContext('2d');
    const gd=g.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);
    gd.addColorStop(0,hexA(col,0.85)); gd.addColorStop(0.35,hexA(col,0.33)); gd.addColorStop(1,hexA(col,0));
    g.fillStyle=gd; g.fillRect(0,0,sz,sz); _glow[col]=c; return c; }

  // ---------- Hintergrund-Themes (pro Level, weicher Crossfade) ----------
  const THEMES=[
    {top:[16,2,31],  mid:[26,5,51],  bot:[8,1,15],   grid:[255,46,136], sun:[255,46,136]}, // Synthwave
    {top:[44,10,22], mid:[92,24,30], bot:[16,3,10],  grid:[255,120,60], sun:[255,90,40]},  // Sonnenuntergang
    {top:[2,22,30],  mid:[6,52,58],  bot:[2,10,18],  grid:[40,255,180], sun:[40,255,200]}, // Aurora
    {top:[4,8,42],   mid:[12,22,74], bot:[2,4,18],   grid:[60,150,255], sun:[80,170,255]}, // Tiefsee
    {top:[30,5,44],  mid:[64,16,86], bot:[12,2,22],  grid:[200,70,255], sun:[255,90,225]}, // Vaporwave
    {top:[42,5,5],   mid:[88,18,6],  bot:[20,2,2],   grid:[255,90,30],  sun:[255,130,20]}  // Inferno
  ];
  const BOSS_THEME={top:[35,2,26],mid:[46,6,38],bot:[8,1,15],grid:[255,120,0],sun:[255,120,0]};
  const cloneTheme=t=>({top:t.top.slice(),mid:t.mid.slice(),bot:t.bot.slice(),grid:t.grid.slice(),sun:t.sun.slice()});
  let curBg=cloneTheme(THEMES[0]);
  const rgbS=a=>`rgb(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])})`;
  function lerpBg(target){ const k=0.07; for(const key of ['top','mid','bot','grid','sun']) for(let i=0;i<3;i++) curBg[key][i]+=(target[key][i]-curBg[key][i])*k; }

  // ---------- Upgrades ----------
  const UPGRADES=[
    {id:'radar',ico:'📡',name:'Radar',desc:'Near-Miss-Radius +45%',max:3,pickup:true,apply:()=>{mods.nearRadius*=1.45;}},
    {id:'shieldgen',ico:'🛡️',name:'Schildgenerator',desc:'+1 Schild jetzt & +1 nach jedem Boss',max:3,apply:()=>{shields=Math.min(shields+1,5);mods.shieldPerBoss++;}},
    {id:'glass',ico:'💎',name:'Glaskanone',desc:'+30% Punkte, aber +15% Hitbox',max:2,apply:()=>{mods.scoreMult*=1.3;mods.playerR*=1.15;player.r=mods.playerR;}},
    {id:'nimble',ico:'⚡',name:'Flink',desc:'Reaktion deutlich schneller',max:3,apply:()=>{mods.follow+=6;}},
    {id:'small',ico:'🔻',name:'Kompakt',desc:'Hitbox −18%',max:2,apply:()=>{mods.playerR*=0.82;player.r=mods.playerR;}},
    {id:'orbval',ico:'🔷',name:'Orb-Veredelung',desc:'Orbs geben +60% Punkte',max:3,pickup:true,apply:()=>{mods.orbValueMult*=1.6;}},
    {id:'magnet',ico:'🧲',name:'Magnetfeld',desc:'Dauerhafter Orb-Sog',max:3,pickup:true,apply:()=>{mods.magnetPassive+=130;}},
    {id:'loot',ico:'🎁',name:'Glücksbringer',desc:'Power-Ups erscheinen 50% öfter',max:2,pickup:true,apply:()=>{mods.powerupRate*=1.5;}},
    {id:'combo',ico:'🔗',name:'Combo-Anker',desc:'Jeder Near-Miss gibt +1 Combo extra',max:2,pickup:true,apply:()=>{mods.comboBonus+=1;}},
    {id:'reflex',ico:'🕙',name:'Reflex-Kern',desc:'Slow-Mo hält 50% länger',max:2,pickup:true,apply:()=>{mods.slowmoMult*=1.5;}},
    {id:'heart',ico:'💗',name:'Extra-Herz',desc:'+1 Leben (max 6)',max:3,apply:()=>{lives=Math.min(lives+1,6);}},
    // ---- Fluch-Karten (lustige Nerfs, Deal with the Devil) ----
    {id:'banana',ico:'🍌',name:'Bananen-Boden',desc:'Steuerung schlüpfrig af, aber +65% Punkte',max:1,curse:true,apply:()=>{mods.follow*=0.7;mods.scoreMult*=1.65;}},
    {id:'smol',ico:'🫠',name:'Smol Brain',desc:'Hitbox +28% (dicke Erbse), dafür +2 Schild',max:1,curse:true,apply:()=>{mods.playerR*=1.28;player.r=mods.playerR;shields=Math.min(shields+2,5);}},
    {id:'energy',ico:'⚡',name:'Energy-Drink-OD',desc:'Hindernisse +22% schneller, Near-Radius +75%',max:1,curse:true,apply:()=>{mods.obSpeed*=1.22;mods.nearRadius*=1.75;}},
    {id:'blind',ico:'🌫️',name:'Drip aber blind',desc:'Sicht eingeschränkt, dafür +90% Punkte',max:1,curse:true,apply:()=>{mods.fog=Math.min(0.82,mods.fog+0.55);mods.scoreMult*=1.9;}},
    {id:'clown',ico:'🤡',name:'Clown-Modus',desc:'30% dichteres Gedränge, aber Orbs ×2 Punkte',max:1,curse:true,apply:()=>{mods.spawnMult*=0.7;mods.orbValueMult*=2;}},
    {id:'mirror',ico:'🪞',name:'Spiegelwelt',desc:'Links/rechts vertauscht 💀, dafür +55% Punkte',max:1,curse:true,apply:()=>{mods.invertX=!mods.invertX;mods.scoreMult*=1.55;}},
    // ---- Globale Waffen-Passive (KEIN Slot, gelten für alle Waffen, multiplikativ = abnehmender Ertrag) ----
    {id:'amp',  ico:'💥',name:'Verstärker',desc:'+22% Schaden für ALLE Waffen',max:6,wpass:true,apply:()=>{ mods.wDmgMult*=1.22; }},
    {id:'tempo',ico:'⏩',name:'Taktung',   desc:'ALLE Waffen feuern 14% schneller',max:5,wpass:true,apply:()=>{ mods.wRate*=1.14; }},
    {id:'crit', ico:'🎯',name:'Zielfokus', desc:'+11% Kritische Treffer (×2 Schaden, rot)',max:5,wpass:true,apply:()=>{ mods.critBase=(mods.critBase||0)+0.11; }}
  ];
  // ---- ARSENAL: 5 eigenständige Auto-Feuer-Waffen, je mit 2 Skill-Gabelungen (D2-light) ----
  // Jede Waffe belegt 1 Slot. Pfad-Wahl = Sidegrade (gleich stark, anderer Stil).
  const WEAPONS=[
    {id:'blaster',ico:'🔫',col:'#caffff',forks:[['rapid','heavy'],['scatter','precise'],['overcharge','stabil'],['volley','lance']]},
    {id:'missile',ico:'🚀',col:'#ff9a2e',forks:[['swarm','warhead'],['shrapnel','incendiary'],['cluster','bunker'],['wide_aoe','rapidload']]},
    {id:'flame',  ico:'🔥',col:'#ffae4d',forks:[['ember','wildfire'],['accel','consume'],['inferno','lingering'],['blaze','firestorm']]},
    {id:'frost',  ico:'❄️',col:'#8fe8ff',forks:[['permafrost','glaciate'],['shatter','brittle'],['deepfreeze','blizzard'],['absolute','frostbite']]},
    {id:'chain',  ico:'⛓️',col:'#9be7ff',forks:[['fork','highv'],['stormhit','dischargeaoe'],['arc','conduit'],['tempest','paralyze']]},
    {id:'nova',   ico:'🟣',col:'#c45bff',forks:[['shock','overload'],['repel','staticfield'],['expand','collapse'],['pulsar','singularity']]},
    {id:'rail',   ico:'⚡',col:'#fff27a',forks:[['charged','autoload'],['wide','overdrive'],['piercebeam','hypervelocity'],['gigawatt','repeater']]}
  ];
  const WID=Object.fromEntries(WEAPONS.map(w=>[w.id,w]));
  // Werkstatt: pro Waffe 4 freischaltbare Fork-Stufen (fu_<id>) → tiefer Grind, gatet die Build-Tiefe
  { const FORKBASE={blaster:120,missile:160,flame:170,frost:185,chain:205,nova:225,rail:245};
    for(const w of WEAPONS) META.push({id:'fu_'+w.id, ico:w.ico, base:FORKBASE[w.id]||180, max:4}); }
  // Spielstil-Archetypen je Waffe → sofort lesbare Build-Identität (Karte zeigt Stil, man muss keine Stats rechnen)
  const ARCH={
    blaster:{ico:'⚡',de:'Dauerfeuer',en:'Sustained',fr:'Tir continu'},
    missile:{ico:'💥',de:'Fläche',    en:'Splash',   fr:'Zone'},
    flame:  {ico:'🔥',de:'Anhaltend', en:'Burn',     fr:'Brûlure'},
    frost:  {ico:'🧊',de:'Kontrolle', en:'Control',  fr:'Contrôle'},
    chain:  {ico:'🔗',de:'Ketten',    en:'Chains',   fr:'Chaînes'},
    nova:   {ico:'🌀',de:'Puls',      en:'Pulse',    fr:'Pulsation'},
    rail:   {ico:'🩸',de:'Burst',     en:'Burst',    fr:'Burst'}
  };
  const wArch=id=>{ const a=ARCH[id]; return a?(a.ico+' '+(a[lang]||a.en)):''; };
  // Synergien (auto, wenn beide Waffen besessen). [id, [weaponA, weaponB], ico]
  const SYNERGIES=[
    {id:'thermo', pair:['flame','frost'],  ico:'🌋'},
    {id:'super',  pair:['frost','chain'],  ico:'🔱'},
    {id:'napalm', pair:['missile','flame'],ico:'🧨'},
    {id:'tesla',  pair:['blaster','chain'],ico:'🌩️'},
    {id:'icebomb',pair:['frost','missile'],ico:'🧊'},
    {id:'cryonova',pair:['nova','frost'],  ico:'❄️'},
    {id:'plasma', pair:['rail','flame'],   ico:'☄️'},
    {id:'voltspark',pair:['chain','nova'], ico:'🟣'},
    {id:'pyrobolt', pair:['blaster','flame'],ico:'🔥'},
    {id:'railnova', pair:['rail','nova'],   ico:'🌀'},
    {id:'cryoshot', pair:['blaster','frost'],ico:'🧊'},
    {id:'novabomb', pair:['missile','nova'],ico:'🌑'},
    {id:'railchain',pair:['rail','chain'],  ico:'🔗'},
    {id:'barrage',  pair:['blaster','missile'],ico:'💢'},
    {id:'shockbolt',pair:['blaster','nova'],   ico:'🟪'},
    {id:'overclock',pair:['blaster','rail'],   ico:'⏩'},
    {id:'clusterarc',pair:['missile','chain'], ico:'🪢'},
    {id:'siege',    pair:['missile','rail'],   ico:'💣'},
    {id:'wildarc',  pair:['flame','chain'],    ico:'🔥'},
    {id:'embernova',pair:['flame','nova'],     ico:'🌋'},
    {id:'cryorail', pair:['frost','rail'],     ico:'❄️'}
  ];
  const SID=Object.fromEntries(SYNERGIES.map(s=>[s.id,s]));
  // Synergien müssen in der Werkstatt mit Coins freigeschaltet werden (permanent), bevor man sie im Run nutzen kann
  { const SYNBASE=500; for(const s of SYNERGIES) META.push({id:'sy_'+s.id, ico:s.ico, base:SYNBASE, max:1}); }
  // Pixel-Schiff-Editor: Pixel-Pakete (heben das Mal-Budget) + Glow-Pixel-Freischaltung
  META.push({id:'pxpack', ico:'✏️', base:160, max:6});   // je Stufe +12 Pixel
  META.push({id:'pxglow', ico:'✨', base:350, max:1});    // Glow-Pixel freischalten
  const PIX_BASE=14, PIX_PER=12;
  const pixBudget=()=>PIX_BASE+metaLvl('pxpack')*PIX_PER;
  const glowUnlocked=()=>metaLvl('pxglow')>0;
  const synBought=id=>metaLvl('sy_'+id)>0;
  const synUnlocked=id=>mode==='zen'||synBought(id);   // Zen = Sandbox: Synergien frei
  const MAXSYN=3;                                    // 3 Fusionen gleichzeitig aktiv
  let arsenal={slots:3,w:{}}, wpn={}, syn={}, activeSyn=[], synSeen={}, synNovas=[];   // activeSyn=belegte Fusions-Slots; synSeen=schon einmal verfügbar; synNovas=Voltbogen-Queue
  let skillPts=0, arsenalSkillMode=false;            // Skillpunkte (pro Upgrade) → klickbarer Baum im Run
  const ownedW=()=>Object.keys(arsenal.w);
  const ownedCount=()=>ownedW().length;
  const synActive=id=>!!syn[id];
  // arsenal.w → aufgelöste Feuerwerte (wpn) + Synergie-Flags (syn). Nach jedem Pick/Drop & bei reset() aufrufen.
  function recalcArsenal(){
    const dm=mods.wDmgMult||1, rm=mods.wRate||1, has=id=>!!arsenal.w[id]; wpn={}; syn={};
    if(has('blaster')){ const a=arsenal.w.blaster; let rate=3.2,dmg=1.15,bolts=1,spread=0.13,pierce=0;
      if(a.f1==='rapid'){rate*=1.5;dmg*=0.8;} if(a.f1==='heavy'){rate*=0.7;dmg*=2.0;}
      if(a.f2==='scatter'){bolts+=2;spread+=0.06;dmg*=0.78;} if(a.f2==='precise'){pierce+=2;dmg*=1.4;}
      if(a.f3==='overcharge'){dmg*=1.4;rate*=0.85;} if(a.f3==='stabil'){spread*=0.4;rate*=1.2;}
      if(a.f4==='volley'){bolts+=1;dmg*=0.85;} if(a.f4==='lance'){pierce+=2;dmg*=1.3;}
      wpn.blaster={rate:rate*rm,dmg:dmg*dm,bolts,spread,pierce}; }
    if(has('missile')){ const a=arsenal.w.missile; let rate=0.6,dmg=4.4,aoe=70,count=1;
      if(a.f1==='swarm'){count=2;dmg*=0.62;aoe*=0.78;} if(a.f1==='warhead'){dmg*=1.55;aoe*=1.5;rate*=0.8;}
      if(a.f3==='cluster'){count+=1;dmg*=0.7;} if(a.f3==='bunker'){dmg*=1.5;rate*=0.8;}
      if(a.f4==='wide_aoe'){aoe*=1.5;} if(a.f4==='rapidload'){rate*=1.6;dmg*=0.7;}
      wpn.missile={rate:rate*rm,dmg:dmg*dm,aoe,count,shrapnel:a.f2==='shrapnel',incendiary:a.f2==='incendiary'}; }
    if(has('flame')){ const a=arsenal.w.flame; let rate=2.2,dmg=0.6,dot=1.45,dur=2.4;
      if(a.f1==='ember'){dot*=2.1;} let spread=a.f1==='wildfire';
      if(a.f2==='accel'){dot*=1.7;dur*=0.62;}
      if(a.f3==='inferno'){dot*=1.85;} if(a.f3==='lingering'){dur*=1.9;}
      if(a.f4==='blaze'){rate*=1.5;dmg*=0.8;} if(a.f4==='firestorm'){dot*=1.4;dur*=1.4;spread=true;}
      wpn.flame={rate:rate*rm,dmg:dmg*dm,dot:dot*dm,dur,spread,consume:a.f2==='consume'}; }
    mods.brittle=false; mods.shatter=false;
    if(has('frost')){ const a=arsenal.w.frost; let rate=2.2,dmg=1.6,slowDur=1.7,slowAmt=0.42;
      if(a.f1==='permafrost'){slowDur*=2.0;slowAmt=0.28;} let freeze=a.f1==='glaciate';
      if(a.f3==='deepfreeze'){slowAmt*=0.55;slowDur*=1.5;} if(a.f3==='blizzard'){rate*=1.5;dmg*=0.75;}
      if(a.f4==='absolute'){freeze=true;} if(a.f4==='frostbite'){dmg*=1.85;rate*=0.85;}
      wpn.frost={rate:rate*rm,dmg:dmg*dm,slowDur,slowAmt,freeze,shatter:a.f2==='shatter',brittle:a.f2==='brittle'};
      mods.brittle=a.f2==='brittle'; mods.shatter=a.f2==='shatter'; }   // SPRÖDE / SPLITTERBRUCH gelten global an gefrorenen Zielen
    if(has('chain')){ const a=arsenal.w.chain; let rate=1.25,dmg=2.5,jumps=4,stun=0;
      if(a.f1==='fork'){jumps+=3;dmg*=0.72;} if(a.f1==='highv'){jumps=Math.max(1,jumps-1);dmg*=2.1;stun=0.5;}
      if(a.f3==='arc'){jumps+=2;dmg*=0.82;} if(a.f3==='conduit'){dmg*=1.8;rate*=0.85;}
      if(a.f4==='tempest'){rate*=1.5;dmg*=0.8;} if(a.f4==='paralyze'){stun+=0.5;dmg*=1.3;}
      wpn.chain={rate:rate*rm,dmg:dmg*dm,jumps,stun,onHit:a.f2==='stormhit',aoe:a.f2==='dischargeaoe'}; }
    if(has('nova')){ const a=arsenal.w.nova; let rate=0.9,dmg=3.2,radius=120,knock=false,slow=false;
      if(a.f1==='shock'){radius*=1.5;} if(a.f1==='overload'){dmg*=1.9;rate*=0.7;}
      if(a.f2==='repel'){knock=true;} if(a.f2==='staticfield'){slow=true;}
      if(a.f3==='expand'){radius*=1.5;} if(a.f3==='collapse'){dmg*=1.8;radius*=0.9;}
      if(a.f4==='pulsar'){rate*=1.6;dmg*=0.75;} if(a.f4==='singularity'){knock=true;slow=true;dmg*=1.3;}
      wpn.nova={rate:rate*rm,dmg:dmg*dm,radius,knock,slow}; }
    if(has('rail')){ const a=arsenal.w.rail; let rate=0.7,dmg=5.4,width=26;
      if(a.f1==='charged'){dmg*=2.0;rate*=0.65;} if(a.f1==='autoload'){rate*=1.7;dmg*=0.65;}
      if(a.f2==='wide'){width*=2;} if(a.f2==='overdrive'){dmg*=1.7;}
      if(a.f3==='piercebeam'){width*=1.6;} if(a.f3==='hypervelocity'){dmg*=1.8;rate*=0.8;}
      if(a.f4==='gigawatt'){dmg*=2.1;rate*=0.7;} if(a.f4==='repeater'){rate*=1.8;dmg*=0.6;}
      wpn.rail={rate:rate*rm,dmg:dmg*dm,width,burn:false}; }
    activeSyn=activeSyn.filter(id=>{ const s=SID[id]; return s&&synUnlocked(id)&&has(s.pair[0])&&has(s.pair[1]); }).slice(0,MAXSYN);  // nur gekaufte & wählbare Slots behalten
    for(const s of SYNERGIES){ const avail=synUnlocked(s.id)&&has(s.pair[0])&&has(s.pair[1]);   // erst nach Werkstatt-Kauf verfügbar (Zen frei)
      if(avail && !synSeen[s.id]){ synSeen[s.id]=1; if(activeSyn.length<MAXSYN && !activeSyn.includes(s.id)) activeSyn.push(s.id); } }
    for(const s of SYNERGIES) syn[s.id]=activeSyn.includes(s.id);                                                   // aktiv = in einem Fusions-Slot
    if(syn.super&&wpn.chain) wpn.chain.jumps+=1;                 // SUPRALEITER: +1 Kettensprung
    if(syn.cryonova&&wpn.nova) wpn.nova.slow=true;              // CRYONOVA: Puls verlangsamt
    if(syn.plasma&&wpn.rail) wpn.rail.burn=true;                // PLASMA: Schiene entzündet
    if(syn.overclock&&wpn.blaster) wpn.blaster.rate*=1.4;       // ÜBERTAKTUNG: Blaster schneller
    if(syn.siege&&wpn.missile){ wpn.missile.dmg*=1.3; wpn.missile.aoe*=1.3; }   // BELAGERUNG: Raketen stärker & größer
    // Krit: Passiv-Basis + Blaster-Pfad „Präzision"
    mods.crit=Math.min(0.75,(mods.critBase||0)+((arsenal.w.blaster&&arsenal.w.blaster.f2==='precise')?0.15:0));
    mods.gun=has('blaster')?1:0;
  }
  const critFactor=()=>1+(mods.crit||0)*((mods.critMult||2)-1);   // erwarteter Krit-Multiplikator
  // Krit-Wurf auf einen Basis-Schaden → {dmg, crit}
  function rollHit(base){ if((mods.crit||0)>0 && Math.random()<mods.crit) return {dmg:base*(mods.critMult||2),crit:true}; return {dmg:base,crit:false}; }
  // Zentrale CC-Anwendung (Slow/Freeze) – respektiert Elite-Widerstand (o.ccRes) & CC-Sättigung (o.ccSat).
  // Wiederholtes Vereisen wirkt zunehmend schwächer → kein „dauerhaft eingefrorenes" Lategame, Ausweichen bleibt relevant.
  function applySlow(o,dur,amt){ if(!o) return;
    const res=o.ccRes||0;
    o.ccSat=Math.min(0.55,(o.ccSat||0)+0.10);              // Gegner „gewöhnt sich" an die Kälte
    const floor=Math.max(res,o.ccSat);                     // Slow-Boden: nie langsamer als das
    o.slow=Math.max(o.slow||0,dur*(1-res*0.5));            // Elites: kürzere Slow-Dauer
    o.slowAmt=Math.min(o.slowAmt!=null?o.slowAmt:1,Math.max(floor,amt)); }
  // Waffen-Level/Fork-Logik: lvl1=Basis, lvl2=Gabelung1 gewählt, lvl3=Gabelung2 gewählt
  function nextNode(id){ const a=arsenal.w[id]; if(!a) return 'new';
    for(const s of ['f1','f2','f3','f4']){ if(!a[s]) return forkShopOpen(id,s)?s:null; }   // nächster Slot nur, wenn in Werkstatt freigeschaltet
    return null; }
  function weaponMaxed(id){ return nextNode(id)===null; }

  function reset(){
    mods={nearRadius:30,scoreMult:1,playerR:13,follow:14,orbValueMult:1,magnetPassive:0,powerupRate:1,comboBonus:0,shieldPerBoss:0,slowmoMult:1,
          obSpeed:1,spawnMult:1,fog:0,invertX:false,
          gun:0,wDmgMult:1,wRate:1,critBase:0,crit:0,critMult:2};
    arsenal={slots:3,w:{}}; wpn={}; syn={}; activeSyn=[]; synSeen={}; synNovas=[]; skillPts=0; arsenalSkillMode=false;
    player={x:W/2,y:H*0.72,r:mods.playerR,trail:[]};
    tgt.x=W/2; tgt.y=H*0.72;
    obstacles=[]; orbs=[]; powerups=[]; clearParticles(); floaters=[]; lasers=[]; bullets=[]; gems=[]; beams=[]; zaps=[]; novas=[]; gibs=[];
    score=0; displayScore=0; combo=0; multiplier=1;
    elapsed=0; spawnT=0; orbT=0; powerupT=rand(7,12); difficulty=1;
    shake=0; flash=0; flashColor='#19f0ff'; nearGlow=0; nearCount=0; deathFlash=0; deathT=0; deathGather=false;
    level=1; levelDuration=(mode==='hardcore')?18:24; levelTimer=levelDuration; unlocked=['straight'];  // Level etwas länger → ruhigerer Form-/Song-Wechsel
    upStep=Math.round(500*(1+(diffMul-1)*0.6)); nextUpgradeAt=upStep;                                    // Upgrade-Karten: höhere Schwierigkeit → höhere Schwelle → seltener
    bossActive=false; bossNumber=1; bossTimer=(mode==='hardcore')?16:22; bossPhaseT=0; laserSpawnT=0;
    banner=null; effects={slowmo:0,magnet:0,double:0}; shields=0; invuln=0; upgradeCounts={}; lives=3;
    curSong=Math.floor(Math.random()*SONGS.length); curBg=cloneTheme(THEMES[0]); commentT=rand(12,20); egg67done=false; egg67T=0;
    comboTime=0; comboTimeMax=3.4; beatIdx=0; beatPulse=0; spawnQueued=false; orbQueued=false;
    director=0.5; overdrive=false; tBlast=0; tMiss=rand(0.3,0.7); tFlame=0; tFrost=0; tChain=rand(0.4,0.8); tNova=rand(0.5,1.0); tRail=rand(0.4,0.9); teslaCount=0; bossPending=false; boss=null; ebullets=[]; gemT=rand(8,13);
    endless=false; madness=0; wonThisRun=false; laserFinal=false;
    runOrbs=0; runPerfect=0; runBosses=0; madnessTime=0; runMaxMult=1; runChipsPaid=0; runChipsEarned=0; coinSaveAcc=0;
    shipSeed=((daily?dailySeed():(Math.random()*1e9))|0)||1;
  }
  // Aktueller Bestwert-Schlüssel (Daily hat eigenen Rekord pro Tag)
  function curBest(){ return daily?(best.daily||0):(best[mode]||0); }
  function setBest(v){ if(daily) best.daily=v; else best[mode]=v; }
  function refillCombo(){ comboTimeMax=Math.max(1.7,(mode==='zen'?4.4:3.4)-multiplier*0.12); comboTime=comboTimeMax; }
  // ---------- Adaptives Balancing: Spielerstärke -> härtere Gegner ----------
  // Gesamt-DPS des Arsenals (Flächen-/Multi-Treffer eingerechnet) → für HP-Skalierung
  function gunDps(){ let d=0;
    if(wpn.blaster) d+=wpn.blaster.dmg*wpn.blaster.bolts*wpn.blaster.rate;
    if(wpn.missile) d+=wpn.missile.dmg*wpn.missile.count*wpn.missile.rate*1.4;
    if(wpn.flame)   d+=(wpn.flame.dmg+wpn.flame.dot*wpn.flame.dur)*wpn.flame.rate;
    if(wpn.frost)   d+=wpn.frost.dmg*wpn.frost.rate;
    if(wpn.chain)   d+=wpn.chain.dmg*wpn.chain.jumps*wpn.chain.rate*0.6;
    if(wpn.nova)    d+=wpn.nova.dmg*wpn.nova.rate*2;   // kleiner Radius → moderateres Flächengewicht (faire HP-Skalierung)
    if(wpn.rail)    d+=wpn.rail.dmg*wpn.rail.rate*1.6;
    return d*critFactor(); }
  // Effektive Einzelziel-DPS gegen den Boss (kein Flächen-Bonus, Raketen ×2 wie in explodeMissile)
  function bossDps(){ let d=0.5;
    if(wpn.blaster) d+=wpn.blaster.dmg*wpn.blaster.bolts*wpn.blaster.rate;
    if(wpn.missile) d+=wpn.missile.dmg*wpn.missile.count*wpn.missile.rate*2;
    if(wpn.flame)   d+=(wpn.flame.dmg+wpn.flame.dot*wpn.flame.dur)*wpn.flame.rate;
    if(wpn.frost)   d+=wpn.frost.dmg*wpn.frost.rate;
    if(wpn.chain)   d+=wpn.chain.dmg*wpn.chain.rate;
    if(wpn.rail)    d+=wpn.rail.dmg*1.5*wpn.rail.rate;
    return d*critFactor(); }
  function pwrSurv(){ let up=0; for(const k in upgradeCounts) up+=upgradeCounts[k];
    return up*0.6 + shields*0.4 + Math.max(0,lives-3)*0.5 + (13-mods.playerR)/13*4
      + Math.max(0,(mods.nearRadius-30)/30) + Math.max(0,(mods.follow-14)/8) + Math.max(0,mods.scoreMult-1); }
  // DDA-Kopplung: ein UNgedeckelter Zusatzdruck, der nur greift, wenn der Spieler souverän cruist
  // (director hoch = viele Near-Misses/Orbs ohne Treffer). Wird man getroffen, fällt director → Druck lässt nach.
  // So bleibt der Grund-Cap als Schutz für schwache Spieler, starke laufen der Schwierigkeit aber nicht mehr davon.
  const ddaPush=()=>Math.max(0,director-0.55)*2.2;
  const difSpd =()=>1+Math.min(0.55,pwrSurv()*0.020)+pwrSurv()*0.011*ddaPush()+(endless?madness*0.85:0);
  const difDen =()=>Math.max(0.32,1-Math.min(0.30,pwrSurv()*0.012)-pwrSurv()*0.006*ddaPush()-(endless?madness*0.35:0));
  // „Coverage": echtes Screen-Clear-Potenzial (Waffen + aktive Fusionen) – treibt die Elite-Häufigkeit,
  // denn genau diese Flächendeckung lässt das Ausweichen sonst verschwinden.
  const coverage  =()=>opt.guns?(ownedCount()+activeSyn.length*1.3):0;
  const eliteChance=()=>(opt.guns&&level>=2)?Math.min(0.42,0.015+(level-1)*0.018+coverage()*0.022+(endless?madness*0.5:0)):0;
  // Obstacles-HP: folgt der Gesamt-DPS (konstante Time-to-Kill) + sanfter Level-Druck,
  // damit sich die Upgrade-Jagd lohnt – wer nicht aufrüstet, wird langsam überrannt.
  const difHp  =()=>1.15+gunDps()*0.27+(level-1)*0.20;
  const introT =()=>Math.max(0,1-elapsed/12);   // Butter-Start: starke Schonung in den ersten ~12s, fadet linear aus
  function finalNum(){ return mode==='hardcore'?10:8; }
  function startGame(m){
    if(m==='daily'){ daily=true; mode='normal'; }
    else if(m){ daily=false; mode=m; }       // m leer (NOCHMAL) → vorigen Typ beibehalten
    useSeed=daily;
    diffMul=(DIFFS[meta.diff||0]||DIFFS[0]).mul;                 // gewählte Schwierigkeit anwenden
    diffSpd =1+(diffMul-1)*(opt.guns?0.52:0.88);                 // Tempo jetzt deutlich spürbar (ohne Waffen stärker, da HP dann egal)
    diffHp  =1+(diffMul-1)*1.35;                                 // HP deutlich stärker (Hauptlast der Schwierigkeit)
    diffDen =1+(diffMul-1)*0.60;                                 // Spawn-Dichte klar fühlbar
    diffChip=0.60+(diffMul-1)*1.30;                              // Chips: Baby ~0.4× (Grind bleibt!), Chuck ~2.2× (Belohnung)
    if(daily){ seedState=dailySeed()|0;
      if(best.dailyDate!==dailyLabel()){ best.daily=0; best.dailyDate=dailyLabel(); saveScores(); } }
    unlockAudio(); reset(); applyMeta(); state=S.PLAY;
    if(daily) unlockAch('daily'); meta.stats=meta.stats||{}; meta.stats['mode_'+mode]=1;
    if(meta.stats.mode_normal&&meta.stats.mode_hardcore&&meta.stats.mode_zen) unlockAch('allmodes'); saveMeta();
    document.getElementById('start').classList.add('hidden');
    document.getElementById('over').classList.add('hidden');
    document.getElementById('upgrade').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    modeNameEl.textContent=daily?(t('modeDaily')+' '+dailyLabel()):modeLabel(mode); bestHud.textContent=t('best')+' '+fmt(curBest());
    if(daily) banner={text:t('daily2'),sub:dailyLabel(),t:2.6,color:'#ffe600'};
    zenExitBtn.style.display='block';
    sfxStart(); vibe(20); lastT=performance.now();
  }
  function toMenu(){ if((state===S.PLAY||state===S.UPGRADE||state===S.PAUSE)&&score>curBest()){ setBest(score); saveScores(); }
    state=S.MENU; document.getElementById('hud').classList.add('hidden');
    document.getElementById('over').classList.add('hidden'); document.getElementById('upgrade').classList.add('hidden');
    document.getElementById('pause').classList.add('hidden'); document.getElementById('shop').classList.add('hidden');
    document.getElementById('settings').classList.add('hidden'); document.getElementById('ach').classList.add('hidden');
    document.getElementById('arsenalView').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden'); updateMenuChips();
  }
  function pauseGame(){ if(state!==S.PLAY) return; state=S.PAUSE;
    pauseSub.textContent=modeLabel(mode)+' · '+Math.round(score)+' '+t('points');
    document.getElementById('pause').classList.remove('hidden'); beep(440,0.08,'square',0.2); }
  function resumeGame(){ if(state!==S.PAUSE) return; state=S.PLAY; invuln=Math.max(invuln,0.9);
    document.getElementById('pause').classList.add('hidden'); lastT=performance.now(); beep(660,0.08,'square',0.2); }

  function addScore(n){ score+=Math.round(n*mods.scoreMult*(effects.double>0?2:1)); }
  function setMult(){ const m=1+Math.floor(combo/4); if(m>multiplier){ multiplier=m; onComboUp(m); } else multiplier=m; if(m>runMaxMult)runMaxMult=m; }
  function onComboUp(m){ floatText(player.x,player.y-30,'x'+m,'#ff2e88',20); checkComboAch(m);
    const w=(P('combo')||{})[m];
    if(w){ banner={text:w,sub:'',t:1.4,color:'#ffe600'}; vibe([15,25,15]); } }
  function bumpCombo(){ comboEl.classList.remove('bump'); void comboEl.offsetWidth; comboEl.classList.add('bump'); }

  // ---------- Easteregg: CODE 67 ----------
  function sfx67(){ if(!actx||muted) return; [[392,0],[523,150],[392,360],[523,510]].forEach(([f,d])=>setTimeout(()=>beep(f,0.16,'square',0.32),d)); }
  function trigger67(){ if(state!==S.PLAY||egg67T>0) return; egg67T=8;
    banner={text:'6️⃣ 7️⃣',sub:'CODE 67 — six seveeen',t:2.8,color:'#ffe600'};
    sfx67(); vibe([67,67,67]); addScore(67); shields=Math.min(shields+1,5); flash=0.55; flashColor='#ffe600';
    for(let i=0;i<18;i++) floatText(rand(40,W-40),rand(H*0.2,H*0.8),'6 7',pick(['#ffe600','#19f0ff','#ff2e88']),rand(16,30));
    spawnParticles(player.x,player.y,'#ffe600',26,300);
  }

  // ---------- Spawning ----------
  function pickPattern(){ if(unlocked.length===1) return 'straight';
    if(grnd()<0.4) return 'straight'; return gpick(unlocked.slice(1)); }
  function spawnObstacle(){
    const key=pickPattern();
    const hc=mode==='hardcore'?1.5:1, zc=mode==='zen'?0.75:1;
    const sp=(76+level*9+Math.min(elapsed*2.6,100))*hc*zc*(mods.obSpeed||1)*(1+(director-0.5)*0.12)*difSpd()*(1-0.30*introT())*1.05*diffSpd;
    const o={pattern:key,near:false,scored:false,trail:[],rot:0,vr:grand(-3,3)};
    if(key==='straight'){ const sh=gpick(['rect','long','diamond']); o.shape=sh; o.color='#ff2e88';
      if(sh==='long'){o.w=grand(90,170);o.h=grand(20,28);} else if(sh==='diamond'){o.w=grand(34,52);o.h=o.w;} else {o.w=grand(30,58);o.h=grand(30,58);}
      o.cx=grand(o.w/2,W-o.w/2); o.cy=-o.h; o.vx=sh==='long'?0:grand(-30,30); o.vy=sp+grand(0,50);
    } else if(key==='sine'){ o.shape='capsule'; o.color='#ff5ea8'; o.w=grand(42,66); o.h=grand(22,30);
      o.baseX=grand(W*0.2,W*0.8); o.amp=grand(70,130); o.freq=grand(0.012,0.02); o.phase=grnd()*6.28; o.cx=o.baseX; o.cy=-o.h; o.vy=sp*0.95;
    } else if(key==='drift'){ o.shape='tri'; o.color='#ff7a2e'; o.w=grand(36,54); o.h=grand(40,58);
      o.cx=grand(W*0.2,W*0.8); o.cy=-o.h; o.vx=grand(-40,40); o.ax=grand(-70,70); o.vy=sp*0.9;
    } else if(key==='orbit'){ o.shape='hex'; o.color='#ff2e6e'; o.w=grand(34,48); o.h=o.w;
      o.radius=grand(50,95); o.baseX=grand(o.radius+24,W-o.radius-24); o.centerY=-o.radius; o.ang=grnd()*6.28; o.angVel=grand(1.6,2.6)*(grnd()<.5?1:-1); o.vy=sp*0.7; o.cx=o.baseX; o.cy=o.centerY;
    } else if(key==='zigzag'){ o.shape='star'; o.color='#ff3b3b'; o.w=grand(32,46); o.h=o.w;
      o.cx=grand(o.w,W-o.w); o.cy=-o.h; o.vx=grand(150,230)*(grnd()<.5?1:-1); o.vy=sp*0.85;
    } else if(key==='pendulum'){ o.shape='ring'; o.color='#ff2eaa'; o.w=grand(36,52); o.h=o.w;
      o.baseX=grand(W*0.3,W*0.7); o.swing=grand(90,150); o.ang=grnd()*6.28; o.angVel=grand(2,3.2); o.vy=sp*0.8; o.cx=o.baseX; o.cy=-o.h;
    }
    o.maxHp=Math.max(1,Math.round(((o.w+o.h)/46+(o.shape==='long'?2:0)+(o.shape==='rect'?1:0))*difHp()*diffHp));
    o.hp=o.maxHp; o.hitFlash=0;
    // ---- Elite/Panzer: überlebt den Screen-Clear & widersteht CC → erzwingt im Lategame wieder echtes Ausweichen ----
    if(grnd()<eliteChance()){
      o.elite=true; o.ccRes=0.5;                      // halbe CC-Wirkung, nie einfrierbar
      o.maxHp=Math.round(o.maxHp*2.4)+2; o.hp=o.maxHp; // zäh: weglasern dauert, er kommt näher
      o.vy*=0.84; if(o.vx) o.vx*=0.84;                // langsamer = lesbarer, bedrohlich heranschwebender Tank
      o.color='#c45bff';
    }
    obstacles.push(o);
  }
  function spawnOrb(){ orbs.push({x:grand(30,W-30),y:-20,r:9,vy:90+difficulty*30,pulse:Math.random()*6.28}); }
  const PUP=['shield','slow','magnet','bomb','double'];
  const PUPINFO={shield:{c:'#2effc0',g:'🛡'},slow:{c:'#5b9bff',g:'⏱'},magnet:{c:'#c45bff',g:'🧲'},bomb:{c:'#ff9a2e',g:'💣'},double:{c:'#ffe600',g:'✕2'}};
  function spawnPowerup(){ const t=gpick(PUP); powerups.push({x:grand(40,W-40),y:-24,r:16,vy:80+difficulty*18,type:t,pulse:Math.random()*6.28}); }
  // Power-Up-Drop aus zerstörtem Gegner (Chance · von Glück skaliert)
  function dropPowerup(x,y){ if(powerups.length>=4) return; const t=gpick(PUP);
    powerups.push({x:Math.max(20,Math.min(W-20,x)),y,r:16,vy:70,type:t,pulse:Math.random()*6.28}); }
  // ---------- Sammelbare Upgrade-Symbole (positiv & Flüche) ----------
  function spawnGem(){
    const pos=UPGRADES.filter(u=>u.pickup&&(upgradeCounts[u.id]||0)<u.max);
    const cur=opt.curses?UPGRADES.filter(u=>u.curse&&(upgradeCounts[u.id]||0)<u.max):[];
    let u,curse=false;
    if(cur.length && Math.random()<0.32){ u=pick(cur); curse=true; }
    else if(pos.length){ u=pick(pos); }
    else if(cur.length){ u=pick(cur); curse=true; }
    else return;
    gems.push({x:rand(50,W-50),y:-28,r:17,vy:70+difficulty*14,u,curse,pulse:Math.random()*6.28,rot:0});
  }
  function applyPickup(u){ u.apply(); upgradeCounts[u.id]=(upgradeCounts[u.id]||0)+1; }
  function collectGem(g){ const u=g.u, col=g.curse?'#ff2e88':'#ffe600'; applyPickup(u); if(g.curse) unlockAch('curse');
    spawnParticles(g.x,g.y,col,18,240); flash=Math.min(0.5,flash+0.16); flashColor=col;
    banner={text:(g.curse?'🎲 ':'')+uName(u.id).toUpperCase(),sub:uDesc(u.id),t:2.0,color:col}; floatText(g.x,g.y-18,u.ico,col,24);
    if(g.curse){ beep(220,0.18,'sawtooth',0.3,-60); setTimeout(()=>beep(140,0.2,'square',0.25,-40),80); vibe([40,30,40]); }
    else { sfxUpgrade(); vibe([15,20,15]); } }

  // ---------- Boss ----------
  function startBoss(){
    if(bossNumber>=5) unlockAch('boss5');
    const isFinal = !endless && bossNumber===finalNum();
    // Mega-Boss bei jedem 2. Boss & im Wahnsinn-Modus immer – wenn man schießen kann
    if(opt.guns && (isFinal || endless || bossNumber%2===0)){ startMegaBoss(isFinal); return; }
    // Laser-Boss (bzw. Laser-Finale, wenn Schießen aus)
    bossActive=true; laserFinal=isFinal; bossPhaseT=isFinal?((mode==='hardcore')?16:14):((mode==='hardcore')?10:8.5); laserSpawnT=0.6;
    banner=isFinal?{text:t('endgegner'),sub:t('finaleSub'),t:2.6,color:'#ff2e88'}:{text:t('bossWave')+bossNumber,sub:'',t:2.2,color:'#ffe600'};
    shake=isFinal?16:10; sfxBoss(); sfxWarn(); vibe([60,40,60]); }
  // ---------- Mega-Boss: prozeduraler Pixel-Sprite-Generator ----------
  function makeRng(s){ s=(s>>>0)||1; return ()=>{ s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; }; }
  const NPRE=['MEGA','GIGA','TURBO','OBER','HYPER','ULTRA','PROTO','OMEGA','KILLER'];
  const NCORE=['GLIBBER','ZAHN','AUGEN','SCHLEIM','NEON','BROCKEN','GRUSEL','WUSEL','KNORP','MATSCH','ZACKEN','BLUBB','GNUBBEL'];
  const NSUF=['MONSTER','VIEH','ZILLA','TRON','KRAKE','KLOPS','BIEST','WUMMS','SCHRECK'];
  const BPALS=[['#ff2e88','#19f0ff','#ffe600'],['#2effc0','#19f0ff','#ff2e88'],['#c45bff','#ff2e88','#19f0ff'],['#ff9a2e','#ffe600','#ff2e88'],['#19f0ff','#2effc0','#ffe600'],['#ff2e6e','#ffd000','#19f0ff'],['#7cff2e','#19f0ff','#ff2e88']];
  function genBossSprite(R,tier){
    const gw=4+tier+((R()*3)|0), gh=4+tier+((R()*3)|0), cp=6+((R()*3)|0), pal=BPALS[(R()*BPALS.length)|0];
    const pad=(tier+4)*cp, cols=gw*2+1, rows=gh*2+1, cw=cols*cp+pad*2, ch=rows*cp+pad*2, ox=pad+gw*cp, oy=pad+gh*cp;
    const grid=new Map(), setc=(x,y,c)=>{ grid.set(x+','+y,c); grid.set((-x)+','+y,c); };
    const h0=R()*6.28,h1=R()*6.28,a3=0.12+R()*0.14,a5=0.05+R()*0.12,squash=0.8+R()*0.5;
    for(let y=-gh;y<=gh;y++) for(let x=0;x<=gw;x++){ const nx=x/gw, ny=(y/gh)/squash, ang=Math.atan2(ny,nx+1e-4);
      if(Math.hypot(nx,ny)<=0.74+a3*Math.sin(ang*3+h0)+a5*Math.sin(ang*5+h1)) setc(x,y,pal[0]); }
    if(R()<0.85){ const py=((gh*0.15+R()*gh*0.4)|0), pw=1+((R()*gw*0.55)|0), ph=1+((R()*2)|0);
      for(let y=py;y<=py+ph;y++) for(let x=0;x<=pw;x++) if(grid.has(x+','+y)) setc(x,y,pal[1]); }
    const horns=R()<0.6?1+((R()*2)|0):0;
    if(horns){ const hx=gw-((R()*2)|0); for(let k=0;k<=tier+1;k++) setc(hx-k,-gh-1-k,pal[2]); }
    if(tier>=3){ for(let y=-gh;y<=gh;y+=2){ if(grid.has(gw+','+y)) setc(gw+1,y,pal[2]); } } // Seitenstacheln
    // backen (Farbe + Weiß-Maske für Trefferblitz)
    const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const cx2=cv.getContext('2d');
    const wv=document.createElement('canvas'); wv.width=cw; wv.height=ch; const wx=wv.getContext('2d');
    grid.forEach((c,k)=>{ const p=k.split(','), gx=+p[0], gy=+p[1], px=ox+gx*cp, py=oy+gy*cp;
      cx2.fillStyle=c; cx2.fillRect(px-cp/2,py-cp/2,cp-1,cp-1); wx.fillStyle='#fff'; wx.fillRect(px-cp/2,py-cp/2,cp-1,cp-1); });
    // dynamische Teile (in px relativ zur Mitte)
    const nEyes=[1,2,2,2,3][(R()*5)|0], eyes=[], es=cp*(1.3+R()*1.1), eyY=-((gh*0.25)|0)*cp;
    if(nEyes===1) eyes.push({ox:0,oy:eyY,s:es*1.3,ph:R()*6.28});
    else { const exx=((gw*0.42)|0)*cp; eyes.push({ox:-exx,oy:eyY,s:es,ph:R()*6.28},{ox:exx,oy:eyY,s:es,ph:R()*6.28}); if(nEyes===3) eyes.push({ox:0,oy:eyY-es,s:es*0.8,ph:R()*6.28}); }
    const mouths=['grin','fangs','o','teeth'], mouth={type:mouths[(R()*4)|0], oy:((gh*0.46)|0)*cp, w:gw*cp*(0.6+R()*0.3)};
    const nT=Math.min(5,((R()*(tier+1))|0)+ (R()<0.5?1:0)), tents=[];
    for(let i=0;i<nT;i++) tents.push({ox:((-gw*0.7+R()*gw*1.4)|0)*cp, len:2+((R()*tier)|0), ph:R()*6.28, col:pal[(R()*3)|0]});
    const nA=R()<0.7?1+((R()*2)|0):0, ants=[];
    for(let i=0;i<nA;i++) ants.push({ox:((i===0?-1:1)*(gw*0.3)|0)*cp, ph:R()*6.28, col:pal[2]});
    const brows=R()<0.55, lights=[]; const bodyKeys=[...grid.keys()];
    for(let i=0;i<2+((R()*3)|0);i++){ const k=bodyKeys[(R()*bodyKeys.length)|0].split(','); lights.push({ox:(+k[0])*cp,oy:(+k[1])*cp,ph:R()*6.28}); }
    return {cv,white:wv,ox,oy,pal,rad:(gw+0.6)*cp,eyes,mouth,tents,ants,brows,lights,cp};
  }
  function genName(R){ return NPRE[(R()*NPRE.length)|0]+'-'+NCORE[(R()*NCORE.length)|0]+'-'+NSUF[(R()*NSUF.length)|0]; }
  function startMegaBoss(final){ bossActive=true;
    const tier=final?7:Math.min(6,Math.max(1,Math.floor(bossNumber/2)));
    const R=makeRng(((daily?dailySeed():(Math.random()*1e9))|0)^Math.imul(bossNumber,2654435761));
    const sp=genBossSprite(R,tier);
    const moves=['orbit','fig8','sway','bob'], atks=['radial','aimed','spiral','wall','cross'];
    boss={sp, final:!!final, enraged:false, name:final?('FINALE: '+genName(R)):genName(R),
      move:moves[(R()*moves.length)|0], attack:atks[(R()*atks.length)|0],
      cx:W/2, cy:H*0.24, radX:Math.min(W*0.30,150+tier*8), radY:Math.min(H*0.11,60+tier*8),
      ang:R()*6.28, angVel:rand(0.6,1.0)*(R()<.5?1:-1)*(final?1.15:1), r:sp.rad,
      maxHp:Math.max(40,Math.round(bossDps()*(10+bossNumber*1.0)*(final?2.0:1)*diffHp)), hp:0, t:0,
      limit:final?9999:(22+bossNumber*2),
      hitFlash:0, shootT:1.5, warn:0, telegraph:false, fireGap:Math.max(0.9,2.5-bossNumber*0.1-Math.min(0.7,pwrSurv()*0.022)),
      dead:false, deathT:0, x:W/2, y:H*0.24, blink:0};
    boss.hp=boss.maxHp; ebullets=[];
    banner=final?{text:t('endgegner'),sub:boss.name,t:3,color:'#ff2e88'}:{text:t('megaBoss'),sub:boss.name,t:2.6,color:'#ffe600'};
    shake=final?20:14; sfxBoss(); sfxWarn(); vibe([60,40,60,40,90]); }
  function eb(x,y,vx,vy){ return {x,y,vx,vy,r:7}; }
  function bossVolley(B){ sfxFire(); shake=Math.max(shake,5); vibe(15);
    const xs=Math.min(5,Math.floor(pwrSurv()*0.28)), spd=(135+bossNumber*7)*(1+Math.min(0.28,pwrSurv()*0.01));
    const tier=Math.min(6,Math.max(1,Math.floor(bossNumber/2)));
    const a0=Math.atan2(player.y-B.y,player.x-B.x);
    if(B.attack==='radial'){ const n=8+tier*2+xs; for(let i=0;i<n;i++){ const a=B.t*0.5+i*6.28/n; ebullets.push(eb(B.x,B.y,Math.cos(a)*spd,Math.sin(a)*spd)); } }
    else if(B.attack==='aimed'){ const n=2+tier+Math.floor(xs/2); for(let i=0;i<n;i++){ const a=a0+(i-(n-1)/2)*0.2; ebullets.push(eb(B.x,B.y,Math.cos(a)*spd*1.25,Math.sin(a)*spd*1.25)); } }
    else if(B.attack==='spiral'){ const n=4+tier+Math.floor(xs/2); for(let i=0;i<n;i++){ const a=B.t*2.2+i*6.28/n; ebullets.push(eb(B.x,B.y,Math.cos(a)*spd,Math.sin(a)*spd)); } }
    else if(B.attack==='wall'){ const gap=rand(0.25,0.75), gw2=Math.max(0.06,0.12-xs*0.008); for(let i=0;i<=10;i++){ if(Math.abs(i/10-gap)<gw2) continue; ebullets.push(eb(W*i/10,B.y,0,spd*0.9)); } }
    else { const n=8+xs; for(let i=0;i<n;i++){ const a=i*6.28/n; ebullets.push(eb(B.x,B.y,Math.cos(a)*spd,Math.sin(a)*spd)); } } }
  function startBossDeath(){ const B=boss; B.dead=true; B.scale=1; ebullets=[];
    effects.slowmo=Math.max(effects.slowmo,1.0); shake=22; vibe([120,60,160]); sfxWin();
    // Zufälliger spektakulärer Abgang (Final-Boss nie als simpler Ballon-Pop)
    B.style=pick(B.final?['bloat','meltdown','implode']:['bloat','balloon','meltdown','implode']);
    if(B.style==='balloon'){            // zerplatzt sofort in rote/weiße Fetzen + Splatter
      B.deathT=0.7;
      spawnGibs(B.x,B.y,44,['#ff2e88','#ff3b3b','#ffffff','#ffd0e0','#ff6a9a'],380,560);
      spawnParticles(B.x,B.y,'#ff3b3b',42,360); spawnParticles(B.x,B.y,'#ffffff',26,300);
      flash=0.6; flashColor='#ff3b6b'; sfxBalloonPop(); }
    else if(B.style==='bloat'){         // pumpt sich auf → Explosion am Ende
      B.deathT=1.4; flash=0.3; flashColor='#ffe600'; sfxBloat(); }
    else if(B.style==='meltdown'){      // strobt & zerfällt elektrisch
      B.deathT=1.5; flash=0.4; flashColor='#19f0ff'; sfxMeltdown(); }
    else {                              // implode: schrumpft in einen Punkt → Schockwelle
      B.deathT=1.1; flash=0.25; flashColor='#c45bff'; sfxImplode(); } }
  function defeatMegaBoss(){ const B=boss, wasFinal=B&&B.final, st=B&&B.style, bx=B?B.x:W/2, by=B?B.y:H*0.28;
    const bonus=(wasFinal?600:160)*multiplier*bossNumber, chips=Math.round(((wasFinal?120:20)+Math.min(bossNumber,15)*8)*diffChip);   // Boss-Chips gedeckelt + ×diffChip
    addScore(bonus); awardCoins(chips,bx,by-44,true); saveMeta();   // Boss-Sieg = großer Gold-Pop
    // ---- Stil-Finale am Boss-Ort ----
    if(st==='bloat'){ flash=0.85; flashColor='#ffe600'; shake=28; sfxBoom();
      pixelBurst(bx,by,'#ffe600',30); pixelBurst(bx,by,'#ff9a2e',22); spawnParticles(bx,by,'#ffffff',40,440);
      if(novas.length<18) novas.push({x:bx,y:by,r0:20,rMax:Math.max(W,H)*0.6,t:0,life:0.5,col:'#ffe600'}); }
    else if(st==='implode'){ flash=0.9; flashColor='#ffffff'; shake=22; sfxBoom();
      pixelBurst(bx,by,'#ffffff',26); pixelBurst(bx,by,'#c45bff',18);
      if(novas.length<18) novas.push({x:bx,y:by,r0:6,rMax:Math.max(W,H)*0.7,t:0,life:0.45,col:'#c45bff'}); }
    else if(st==='meltdown'){ flash=0.6; flashColor='#19f0ff'; shake=18; sfxBoom();
      pixelBurst(bx,by,'#19f0ff',26); spawnGibs(bx,by,18,['#19f0ff','#caffff','#ffffff'],320,520); }
    else { spawnParticles(bx,by,'#ff3b3b',16,300); spawnParticles(bx,by,'#ffffff',10,260); }   // balloon: schon zerfetzt → kleiner Nachschlag
    vibe([20,30,40]); runBosses++; unlockAch('mega');
    for(let i=0;i<mods.shieldPerBoss;i++) shields=Math.min(shields+1,5);
    boss=null; bossActive=false; bossNumber++;
    if(wasFinal) winGame();
    else { banner={text:t('defeated'),sub:'+'+bonus+' · ◈ '+chips,t:2.8,color:'#2effc0'}; bossTimer=(mode==='hardcore')?24:30; } }
  function winGame(){ endless=true; madness=0; wonThisRun=true; meta.won=(meta.won||0)+1; saveMeta(); unlockAch('won');
    banner={text:t('beaten'),sub:t('beatenSub'),t:4.5,color:'#ffe600'};
    flash=0.85; flashColor='#ffe600'; shake=26; effects.slowmo=Math.max(effects.slowmo,1.4);
    for(let i=0;i<6;i++) pixelBurst(rand(W*0.2,W*0.8),rand(H*0.18,H*0.6),pick(['#ffe600','#ff2e88','#19f0ff','#2effc0']),10);
    sfxWin(); setTimeout(()=>{sfxWin();},220); setTimeout(()=>{sfxRiser();},520); vibe([120,40,120,40,200,60,220]);
    setTimeout(()=>{ if(state===S.PLAY) banner={text:t('madness'),sub:t('madnessSub'),t:3,color:'#ff2e88'}; },2700);
    bossTimer=(mode==='hardcore')?9:12; }
  function bossFlee(){ ebullets=[];
    if(boss && !boss.fleeing){   // Mega-Boss: lachend, wachsend davonfliegen (statt sofort weg)
      boss.fleeing=true; boss.fleeT=1.9; boss.scale=1; boss.laughT=0; boss.telegraph=false;
      banner={text:t('escaped'),sub:t('escapedSub'),t:2.4,color:'#9a86c9'};
      sfxLaugh(); flash=0.3; flashColor='#c45bff'; shake=10; vibe([30,40,30,40,60]); return; }
    endBossFlee(); }
  function endBossFlee(){ banner=banner||{text:t('escaped'),sub:t('escapedSub'),t:2.4,color:'#9a86c9'};
    boss=null; bossActive=false; bossNumber++; bossTimer=(mode==='hardcore')?24:30; }
  function updateMegaBoss(dt,ts){ const B=boss;
    if(B.dead){ B.deathT-=dt; const st=B.style;
      if(st==='bloat'){ B.scale=(B.scale||1)+dt*1.05; const j=B.scale*1.4; B.x+=rand(-j,j); B.y+=rand(-j,j);   // pumpt sich auf & bebt
        if(Math.random()<0.5) pixelBurst(B.x+rand(-B.r,B.r)*B.scale,B.y+rand(-B.r,B.r)*B.scale,pick(['#ffe600','#ff9a2e','#ffffff']),2); }
      else if(st==='balloon'){ B.scale=Math.max(0.04,(B.scale||1)-dt*3.2); B.x+=Math.sin(B.deathT*70)*5; B.y+=Math.cos(B.deathT*58)*4; }   // entleert sich zischend
      else if(st==='meltdown'){ B.flick=Math.random()<0.5; B.x+=rand(-3,3); B.y+=rand(-2,2);                  // strobt & knistert
        if(Math.random()<0.55 && zaps.length<26){ const a=Math.random()*6.28; zaps.push({pts:[[B.x,B.y],[B.x+Math.cos(a)*B.r,B.y+Math.sin(a)*B.r],[B.x+Math.cos(a)*B.r*1.7+rand(-20,20),B.y+Math.sin(a)*B.r*1.7+rand(-20,20)]],t:0.12,life:0.12}); }
        if(Math.random()<0.4) pixelBurst(B.x+rand(-B.r,B.r),B.y+rand(-B.r,B.r),pick(['#19f0ff','#caffff','#ffffff']),1); }
      else { B.scale=Math.max(0,(B.scale||1)-dt*0.92);                                                        // implodiert: saugt Funken nach innen
        if(Math.random()<0.8){ const a=Math.random()*6.28, rr=B.r*2.4; emitP(B.x+Math.cos(a)*rr,B.y+Math.sin(a)*rr,-Math.cos(a)*300,-Math.sin(a)*300,0.05,pick(['#c45bff','#ff2e88','#caffff']),rand(2,4)); } }
      if(B.deathT<=0) defeatMegaBoss(); return; }
    if(B.fleeing){ B.fleeT-=dt; B.t+=dt*3.4;                       // lacht & wackelt schneller
      B.scale=Math.min(2.4,(B.scale||1)+dt*0.95);                  // wird größer
      B.y-=dt*(70+(1.9-B.fleeT)*300);                             // fliegt hoch (beschleunigt)
      B.x+=Math.sin(B.t*1.4)*3.2;                                 // schlenkert
      B.laughT-=dt; if(B.laughT<=0){ sfxLaugh(); B.laughT=0.64; }
      if(Math.random()<0.4) pixelBurst(B.x+rand(-B.r,B.r),B.y+rand(-B.r,B.r),pick(['#ffe600','#c45bff','#19f0ff','#2effc0']),2);
      if(B.fleeT<=0 || B.y < -B.r*2.6*(B.scale||1)) endBossFlee();
      return; }
    B.t+=dt*ts; if(B.hitFlash>0) B.hitFlash-=dt; if(B.blink>0) B.blink-=dt;
    if(B.t>B.limit){ bossFlee(); return; }      // Timeout: entkommt mit der Beute (kein Soft-Lock)
    if(B.blink<=0 && Math.random()<0.012) B.blink=0.16;   // gelegentliches Blinzeln
    if(B.final && !B.enraged && B.hp<=B.maxHp*0.5){ B.enraged=true; B.angVel*=1.6; B.fireGap*=0.55; B.attack='spiral';
      banner={text:t('enrage'),sub:t('enrageSub'),t:2,color:'#ff2e88'}; flash=0.5; flashColor='#ff2e88'; shake=18; sfxWarn(); vibe([40,30,40,30,60]); }
    B.ang+=B.angVel*dt*ts;
    if(B.move==='fig8'){ B.x=B.cx+Math.cos(B.ang)*B.radX; B.y=B.cy+Math.sin(B.ang*2)*B.radY; }
    else if(B.move==='sway'){ B.x=B.cx+Math.sin(B.ang)*B.radX; B.y=B.cy+Math.sin(B.ang*0.5)*B.radY*0.5; }
    else if(B.move==='bob'){ B.x=B.cx+Math.sin(B.t*1.2)*B.radX*0.85; B.y=B.cy+Math.abs(Math.sin(B.t*1.7))*B.radY; }
    else { B.x=B.cx+Math.cos(B.ang)*B.radX; B.y=B.cy+Math.sin(B.ang)*B.radY; }
    if(!B.telegraph){ B.shootT-=dt*ts; if(B.shootT<=0){ B.telegraph=true; B.warn=0.55; sfxWarn(); } }
    else { B.warn-=dt*ts; if(B.warn<=0){ bossVolley(B); B.telegraph=false; B.shootT=B.fireGap; } } }
  function endBoss(){ bossActive=false; const wasFinal=laserFinal; laserFinal=false; bossTimer=(mode==='hardcore')?24:30;
    const bonus=(wasFinal?500:100)*multiplier*bossNumber; addScore(bonus);
    spawnParticles(W/2,H*0.4,'#ffe600',wasFinal?60:36,300);
    flash=0.5; flashColor='#ffe600'; sfxWin(); vibe([20,30,40]);
    for(let i=0;i<mods.shieldPerBoss;i++) shields=Math.min(shields+1,5);
    bossNumber++; runBosses++;
    if(wasFinal){ const chips=Math.round((120+Math.min(bossNumber,15)*8)*diffChip); meta.chips=(meta.chips||0)+chips; saveMeta(); updateMenuChips(); winGame(); }
    else banner={text:t('survived'),sub:'+'+bonus,t:2.2,color:'#2effc0'}; }
  function spawnLaserWave(){ const mixed=bossNumber>=3, vert=(bossNumber%2===1);
    const count=Math.min(6,1+Math.floor(bossNumber/2)+Math.min(2,Math.floor(pwrSurv()*0.14)));
    const warn=Math.max(0.4,1-bossNumber*0.05-Math.min(0.25,pwrSurv()*0.012));
    for(let i=0;i<count;i++){ const orient=mixed?(Math.random()<0.5?'v':'h'):(vert?'v':'h');
      const pos=orient==='v'?rand(W*0.1,W*0.9):rand(H*0.15,H*0.9);
      lasers.push({orient,pos,thick:rand(42,64),state:'warn',t:0,warnDur:warn,fireDur:0.45}); }
    sfxWarn(); }

  // ---------- Level / Upgrade flow ----------
  const UNLOCK={2:{key:'sine',name:'Wellenflug'},3:{key:'drift',name:'Gleiter'},4:{key:'orbit',name:'Kreisel'},5:{key:'zigzag',name:'Irrläufer'},6:{key:'pendulum',name:'Pendler'}};
  function levelUp(){ level++; levelTimer=levelDuration;
    const u=UNLOCK[level]; let sub=t('faster');
    if(u){ unlocked.push(u.key); sub=t('newForm')+formName(u.key); }
    if(SONGS.length>1){ do{ pendingSong=Math.floor(Math.random()*SONGS.length); }while(pendingSong===curSong); }   // neuen Song nur VORMERKEN – Einblendung erfolgt schleichend an ruhiger Stelle (kein Riser/Ansage)
    banner={text:t('lvl')+' '+level,sub,t:2.6,color:'#19f0ff'}; sfxLevel(); vibe([20,25,20]);
    flash=0.4; flashColor='#19f0ff';
  }
  // Passiv-Upgrade-Angebote für die Level-Up-Karten. Waffen/Skills laufen jetzt über den klickbaren Baum (Skillpunkte).
  function offerPool(){ const out=[];
    for(const u of UPGRADES){ if(u.curse||u.pickup) continue; if((upgradeCounts[u.id]||0)>=u.max) continue;
      if(u.wpass && (!opt.guns||ownedCount()===0)) continue; out.push({kind:'pass',u}); }
    return out; }
  // Gibt es überhaupt einen freischaltbaren Knoten/eine holbare Waffe? (unabhängig von Punkten)
  function skillSpendable(){ if(!opt.guns) return false;
    for(const id of ownedW()){ if(nextNode(id)) return true; }
    return ownedCount()<arsenal.slots && WEAPONS.some(w=>!arsenal.w[w.id] && weaponUnlocked(w.id)); }
  // Hat man einen Punkt UND etwas zum Ausgeben?
  function hasSkillSpend(){ return skillPts>0 && skillSpendable(); }
  // Live-Chips: aus Score+Near abgeleitetes Run-Guthaben (ohne Boss-Live-Chips, ohne Sieg-Bonus → die laufen separat)
  function scoreChips(){ const s=score||0, scChips=s<=25000?s/40:25000/40+(s-25000)/120;   // schnellere Progression: mehr Coins pro Punkt
    return Math.max(0,Math.round((scChips+(nearCount||0)*1.0)*chipMult()*diffChip)); }
  let coinSaveAcc=0;
  function accrueChips(force){ if(force===undefined) force=true;        // stiller Score-Trickle (Ökonomie-Backbone)
    const tgt=scoreChips();
    if(tgt>runChipsPaid){ meta.chips=(meta.chips||0)+(tgt-runChipsPaid); coinSaveAcc+=(tgt-runChipsPaid); runChipsPaid=tgt; updateMenuChips(); }
    if(force||coinSaveAcc>=30){ saveMeta(); coinSaveAcc=0; } }
  // Sichtbare Coin-Belohnung an Ort X/Y (Dopamin: Gold-Pop). Quelle klar erkennbar (Orb/Combo/Boss).
  function awardCoins(n,x,y,big){ n=Math.max(0,Math.round(n)); if(!n) return;
    meta.chips=(meta.chips||0)+n; runChipsEarned+=n; coinSaveAcc+=n; updateMenuChips();
    if(x!=null) floatText(x,y,'+◈'+n,'#ffd23f',big?22:16);
    if(coinSaveAcc>=30){ saveMeta(); coinSaveAcc=0; } }
  function openUpgrade(armed){ skillPts++; accrueChips(); updateRunShopBtns();   // jede Upgrade-Stufe = 1 Skillpunkt (angespart, nutzbar sobald in Werkstatt freigeschaltet) + Live-Chips gutschreiben
    state=S.UPGRADE; sfxUpgrade(); vibe([30,20,30]);
    const utitleEl=document.querySelector('#upgrade .utitle');
    if(utitleEl) utitleEl.textContent=armed?t('arsenal'):t('chooseUp');
    upgradeSub.textContent=armed?(t('armUp')+level):(t('level')+' '+level+' · '+t('points')+' '+Math.round(score));
    const pool=offerPool(); const wp=pool.filter(o=>o.kind!=='pass'), pp=pool.filter(o=>o.kind==='pass');
    let chosen=[]; const take=arr=>{ if(arr.length) chosen.push(arr.splice(Math.floor(Math.random()*arr.length),1)[0]); };
    if(armed){ while(chosen.length<2&&wp.length) take(wp); while(chosen.length<3&&pp.length) take(pp); while(chosen.length<3&&wp.length) take(wp); }
    else { while(chosen.length<3){ if((chosen.length<2||!pp.length)&&wp.length) take(wp); else if(pp.length) take(pp); else break; } }
    while(chosen.length<3 && (wp.length||pp.length)) take(wp.length?wp:pp);
    if(!chosen.length){ closeUpgrade(); return; }   // alles maxed & Slots voll → einfach weiter
    for(let i=chosen.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [chosen[i],chosen[j]]=[chosen[j],chosen[i]]; }
    upgradeCards.innerHTML='';
    chosen.forEach(o=>{ const card=document.createElement('div'); let ico,name,desc,tag,cls='ucard';
      if(o.kind==='new'){ ico=WID[o.wid].ico; name=wName(o.wid); desc=wDesc(o.wid); tag='🆕 '+t('newWeapon'); cls+=' weapon wnew'; }
      else if(o.kind==='fork'){ ico=WID[o.wid].ico; name=wName(o.wid)+' · '+pName(o.path); desc=pDesc(o.path); tag='⌥ '+t('path'); cls+=' weapon wfork'; }
      else { const u=o.u, lvl=(upgradeCounts[u.id]||0); ico=u.ico; name=uName(u.id); desc=uDesc(u.id); tag=(lvl>0?(t('level')+' '+lvl+'/'+u.max):('0/'+u.max)); if(u.wpass) cls+=' weapon'; }
      card.className=cls; card.innerHTML=`<div class="ico">${ico}</div><h4>${name}</h4><p>${desc}</p><div class="stack">${tag}</div>`;
      card.addEventListener('click',()=>chooseOffer(o)); upgradeCards.appendChild(card);
    });
    document.getElementById('upgrade').classList.remove('hidden');
  }
  function closeUpgrade(){ document.getElementById('upgrade').classList.add('hidden');
    upStep=Math.round(upStep*1.55); nextUpgradeAt=score+upStep;
    if(hasSkillSpend()){ openSkillScreen(); return; }     // weiter zum klickbaren Skill-Baum
    state=S.PLAY; invuln=Math.max(invuln,1.0); lastT=performance.now(); }
  function chooseOffer(o){ const before=Object.assign({},syn); let label='';
    if(o.kind==='new'){ arsenal.w[o.wid]={lvl:1,f1:null,f2:null,f3:null,f4:null}; label=wName(o.wid); }
    else if(o.kind==='fork'){ const a=arsenal.w[o.wid]; a[o.slot]=o.path; a.lvl++; label=wName(o.wid)+' · '+pName(o.path); }
    else { o.u.apply(); upgradeCounts[o.u.id]=(upgradeCounts[o.u.id]||0)+1; label=uName(o.u.id); }
    recalcArsenal(); sfxPow(); vibe(15);
    banner={text:label.toUpperCase(),sub:t('activated'),t:1.6,color:'#ffe600'};
    for(const s of SYNERGIES){ if(syn[s.id]&&!before[s.id]){ banner={text:s.ico+' '+synName(s.id)+' · '+t('synUnlocked'),sub:synDesc(s.id),t:2.8,color:'#ff2e88'};
      floatText(player.x,player.y-44,s.ico,'#ff2e88',32); flash=Math.min(0.7,flash+0.3); flashColor='#ff2e88'; } }
    closeUpgrade(); }

  // ---------- Hit ----------
  function hitPlayer(color){
    if(invuln>0) return false;
    director=Math.max(0,director-0.2);   // Director: bei Treffer Druck rausnehmen
    if(shields>0){ shields--; invuln=1.4; flash=0.5; flashColor='#2effc0'; shake=14;
      spawnParticles(player.x,player.y,'#2effc0',22,260); sfxShieldBreak(); vibe([30,40,30]);
      floatText(player.x,player.y-26,t('shieldGone'),'#2effc0',18); return false; }
    if(mode==='zen'){ combo=0; multiplier=1; invuln=0.8; flash=0.5; flashColor='#ff2e88'; shake=12;
      spawnParticles(player.x,player.y,'#ff2e88',16,220); beep(200,0.18,'square',0.3,-80); vibe(40);
      floatText(player.x,player.y-24,t('comboGoneZ'),'#ff2e88',16); return false; }
    lives--;
    if(lives>0){ invuln=1.6; flash=0.6; flashColor='#ff2e88'; shake=16; combo=0; multiplier=1;
      spawnParticles(player.x,player.y,'#ff4d6d',26,300); sfxShieldBreak(); beep(220,0.3,'sawtooth',0.4,-120); vibe([70,40,70]);
      floatText(player.x,player.y-28,t('lifeLost'),'#ff4d6d',20); banner={text:lives+t('livesLeft'),sub:'',t:1.3,color:'#ff4d6d'}; return false; }
    gameOver(); return true;
  }

  // ---------- Update ----------
  function update(dt){
    elapsed+=dt; const dGrow=mode==='hardcore'?0.046:0.032; difficulty=1+Math.min(elapsed,150)*dGrow;
    const ts=effects.slowmo>0?0.42:1;
    if(invuln>0) invuln-=dt;
    for(const k in effects) if(effects[k]>0) effects[k]-=dt;

    // Beat-Clock (rhythmische Spawns + Puls auf dem Backbeat)
    const step8=Math.floor(elapsed/(secPerStep*2)), onStep=step8>beatIdx;
    if(onStep){ beatIdx=step8; if(step8%2===0){ const beat=(step8/2)%4; if(beat===1||beat===3) beatPulse=1; } }
    beatPulse=Math.max(0,beatPulse-dt*3.2);

    // Combo-Decay: Streak verfällt, wenn man zu lange nichts riskiert
    if(combo>0){ comboTime-=dt; if(comboTime<=0){ combo=0; multiplier=1; comboTime=0;
      floatText(player.x,player.y-30,t('comboOut'),'#9a86c9',16); beep(330,0.12,'sine',0.14,-120); } }

    // Adaptiver Director: pendelt langsam zur Mitte zurück (Near-Miss/Hit schubsen ihn)
    director+=(0.5-director)*Math.min(1,dt*0.25);
    // Combo-Overdrive ab x8
    const od=multiplier>=8;
    if(od&&!overdrive){ banner={text:t('overdrive'),sub:t('overdriveSub'),t:1.8,color:'#19f0ff'}; flash=Math.max(flash,0.4); flashColor='#19f0ff'; vibe([20,30,20]); }
    overdrive=od;
    if(endless){ madness+=dt*0.0075; madnessTime+=dt; if(madnessTime>=60) unlockAch('madness'); }   // Wahnsinn-Modus eskaliert – aber gemächlich

    player.r+= (mods.playerR-player.r)*0.2;
    player.x+=(tgt.x-player.x)*Math.min(1,dt*mods.follow);
    player.y+=(tgt.y-player.y)*Math.min(1,dt*mods.follow);
    player.x=Math.max(player.r,Math.min(W-player.r,player.x));
    player.y=Math.max(player.r,Math.min(H-player.r,player.y));
    player.trail.push({x:player.x,y:player.y}); if(player.trail.length>18) player.trail.shift();
    for(const s of stars){ s.y+=(20+s.z*40)*dt; if(s.y>H){s.y=-2;s.x=Math.random()*W;} }

    // Level timing
    if(!bossActive){ levelTimer-=dt; if(levelTimer<=0) levelUp(); }
    // Upgrade trigger
    if(!bossActive && score>=nextUpgradeAt){ openUpgrade(); return; }

    // Boss timing
    if(mode!=='zen'){
      if(!bossActive){
        if(bossPending){ bossPending=false; startBoss(); }       // nach Arsenal-Pick: Boss starten
        else { bossTimer-=dt; if(bossTimer<=0){
          // Kurz vor dem Boss: Upgrade-Karte + Skillpunkt anbieten
          if(opt.guns||offerPool().length){ bossPending=true; openUpgrade(true); return; } else startBoss();
        } }
      }
      else if(boss){ updateMegaBoss(dt,ts); }
      else { bossPhaseT-=dt;
        if(bossPhaseT>1.6){ laserSpawnT-=dt; if(laserSpawnT<=0){ spawnLaserWave(); laserSpawnT=Math.max(0.7,1.5-bossNumber*0.08); } }
        if(bossPhaseT<=0 && lasers.length===0) endBoss();
      }
    }
    // Spawns – auf das nächste Achtel quantisiert (alles passiert „auf dem Beat")
    if(!bossActive){ spawnT-=dt; if(spawnT<=0) spawnQueued=true;
      if(spawnQueued && onStep){ spawnObstacle(); spawnQueued=false;
        spawnT=Math.max(0.30,(1.0-difficulty*0.040-level*0.013)*(mods.spawnMult||1)*(1-(director-0.5)*0.28)*difDen()*(1+0.8*introT())*0.95/diffDen); } }
    if(mode!=='hardcore'){ orbT-=dt; if(orbT<=0) orbQueued=true;
      if(orbQueued && onStep && step8%2===1){ spawnOrb(); orbQueued=false; orbT=rand(0.9,1.8); } }
    // Power-Ups: Drops aus Gegnern (killObstacle) + leichte Grund-Spawn-Uhr, damit auch am Anfang welche kommen
    powerupT-=dt; if(powerupT<=0){ if(powerups.length<2 && !bossActive) spawnPowerup(); powerupT=rand(13,19); }
    // Auto-Fire (sobald eine Waffe ausgerüstet ist)
    // Auto-Fire pro Waffe (touch-freundlich: feuert selbstständig sobald Cooldown bereit, Zielen automatisch)
    if(opt.guns){
      if(wpn.blaster){ tBlast-=dt; if(tBlast<=0){ fireBlaster(); tBlast=1/wpn.blaster.rate; } }
      if(wpn.missile){ tMiss-=dt;  if(tMiss<=0){  fireMissileW(); tMiss=1/wpn.missile.rate; } }
      if(wpn.flame){   tFlame-=dt; if(tFlame<=0){ fireFlame();    tFlame=1/wpn.flame.rate; } }
      if(wpn.frost){   tFrost-=dt; if(tFrost<=0){ fireFrost();    tFrost=1/wpn.frost.rate; } }
      if(wpn.chain){   tChain-=dt; if(tChain<=0){ fireChainW();   tChain=1/wpn.chain.rate; } }
      if(wpn.nova){    tNova-=dt;  if(tNova<=0){  fireNova();     tNova=1/wpn.nova.rate; } }
      if(wpn.rail){    tRail-=dt;  if(tRail<=0){  fireRail();     tRail=1/wpn.rail.rate; } }
      if(synNovas.length){ const q=synNovas; synNovas=[]; for(const p of q) miniNova(p.x,p.y); }   // VOLTBOGEN: gequeuete Mini-Novas
      for(let i=beams.length-1;i>=0;i--){ beams[i].t-=dt; if(beams[i].t<=0) beams.splice(i,1); }
      for(let i=zaps.length-1;i>=0;i--){ zaps[i].t-=dt; if(zaps[i].t<=0) zaps.splice(i,1); }
      for(let i=novas.length-1;i>=0;i--){ novas[i].t+=dt; if(novas[i].t>=novas[i].life) novas.splice(i,1); }
    }
    for(let i=gibs.length-1;i>=0;i--){ const g=gibs[i]; g.x+=g.vx*dt; g.y+=g.vy*dt; g.vy+=g.grav*dt; g.vx*=0.99; g.rot+=g.vr*dt; g.life-=dt; if(g.life<=0||g.y>H+50) gibs.splice(i,1); }   // Gibs immer (auch ohne Waffen, z.B. Boss-Splatter)
    if(egg67T>0) egg67T-=dt;
    if(!egg67done && score>=67){ egg67done=true; floatText(player.x,player.y-52,'6 7 !!','#ffe600',26); sfx67(); vibe([30,30]); }
    commentT-=dt; if(commentT<=0 && !bossActive){ floatText(W/2+rand(-30,30),H*0.2,pick(P('dumb')),'#9be7ff',16); commentT=rand(15,26); }

    // Lasers
    for(let i=lasers.length-1;i>=0;i--){ const L=lasers[i]; L.t+=dt*ts;
      if(L.state==='warn'&&L.t>=L.warnDur){ L.state='fire'; L.t=0; sfxFire(); shake=Math.max(shake,6); vibe(20); }
      if(L.state==='fire'){ const hit=L.orient==='v'?Math.abs(player.x-L.pos)<L.thick/2+player.r:Math.abs(player.y-L.pos)<L.thick/2+player.r;
        if(hit){ if(hitPlayer('#ff2e88')) return; } if(L.t>=L.fireDur) lasers.splice(i,1); } }

    // Obstacles
    for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i];
      if(o.hitFlash>0) o.hitFlash-=dt;
      // Frost: verlangsamt die Bewegung; Brand: Schaden über Zeit
      if(o.slow>0) o.slow-=dt;
      if(o.burn>0){ o.burn-=dt; let bd=(o.burnDmg||0); if(syn.thermo&&o.slow>0) bd*=1.9;   // THERMOSCHOCK: brennend+gefroren
        o.hp-=bd*dt;
        if(Math.random()<0.8) emitP(o.cx+rand(-o.w*0.35,o.w*0.35),o.cy+rand(-4,6),rand(-18,18),-rand(45,100),0.45,Math.random()<0.4?'#ffe24d':'#ff5a1a',rand(3,6));   // aufsteigende Glut
        o.burnTick=(o.burnTick||0)+bd*dt; if(o.burnTick>=3){ floatDamage(o.cx+rand(-6,6),o.cy-o.h*0.5,o.burnTick,false); o.burnTick=0; }   // sichtbarer Brennschaden
        if(o.hp<=0){ if(o.burnConsume) addScore(6); killObstacle(o); obstacles.splice(i,1); continue; } }
      if(o.slow>0 && Math.random()<0.3) emitP(o.cx+rand(-o.w*0.4,o.w*0.4),o.cy+rand(-o.h*0.4,o.h*0.4),0,rand(8,26),0.5,'#cdf2ff',rand(2,4));   // Frost-Funkeln
      const mt=dt*ts*(o.slow>0?(o.slowAmt!=null?o.slowAmt:0.5):1);
      if(o.pattern!=='straight'){ o.trail.push({x:o.cx,y:o.cy}); if(o.trail.length>9) o.trail.shift(); }
      if(o.pattern==='straight'){ o.cy+=o.vy*mt; o.cx+=o.vx*mt; if(o.shape==='diamond')o.rot+=o.vr*mt; if(o.cx<o.w/2||o.cx>W-o.w/2)o.vx*=-1; }
      else if(o.pattern==='sine'){ o.cy+=o.vy*mt; o.cx=o.baseX+o.amp*Math.sin(o.cy*o.freq+o.phase); }
      else if(o.pattern==='drift'){ o.vx+=o.ax*mt; o.cx+=o.vx*mt; o.cy+=o.vy*mt; o.rot+=o.vr*mt*0.3; }
      else if(o.pattern==='orbit'){ o.centerY+=o.vy*mt; o.ang+=o.angVel*mt; o.cx=o.baseX+o.radius*Math.cos(o.ang); o.cy=o.centerY+o.radius*Math.sin(o.ang); }
      else if(o.pattern==='zigzag'){ o.cy+=o.vy*mt; o.cx+=o.vx*mt; if(o.cx<o.w/2){o.cx=o.w/2;o.vx*=-1;} if(o.cx>W-o.w/2){o.cx=W-o.w/2;o.vx*=-1;} o.rot+=8*mt; }
      else if(o.pattern==='pendulum'){ o.cy+=o.vy*mt; o.ang+=o.angVel*mt; o.cx=o.baseX+o.swing*Math.sin(o.ang); }

      const hw=o.w/2,hh=o.h/2;
      // Rotations- & formgenaue Hitbox (fairer als die alte AABB für alle Formen)
      let lx=player.x-o.cx, ly=player.y-o.cy;
      if(o.rot){ const c=Math.cos(o.rot), s=Math.sin(o.rot), rx=lx*c+ly*s; ly=-lx*s+ly*c; lx=rx; }
      let d2;
      if(o.shape==='rect'||o.shape==='long'||o.shape==='capsule'){
        const qx=Math.max(-hw,Math.min(lx,hw)), qy=Math.max(-hh,Math.min(ly,hh)), ex=lx-qx, ey=ly-qy; d2=ex*ex+ey*ey;
      } else if(o.shape==='ring'){
        const R=o.w*0.4, t=o.w*0.13, dd=Math.max(0,Math.abs(Math.hypot(lx,ly)-R)-t); d2=dd*dd; // Loch in der Mitte ist sicher
      } else { // diamond/tri/hex/star → eng anliegender effektiver Radius statt Eck-Leerraum
        const er=o.w*({diamond:0.44,tri:0.44,hex:0.46,star:0.46}[o.shape]||0.45), dd=Math.max(0,Math.hypot(lx,ly)-er); d2=dd*dd;
      }
      if(invuln<=0 && d2<player.r*player.r){ spawnParticles(player.x,player.y,o.color,10,180); obstacles.splice(i,1); if(hitPlayer(o.color)) return; continue; }
      const nr=player.r+mods.nearRadius;
      if(invuln<=0 && o.near){ const gap=Math.sqrt(d2)-player.r; if(gap<o.minGap) o.minGap=gap; }
      if(!o.near && invuln<=0 && d2<nr*nr && d2>player.r*player.r){ o.near=true; o.minGap=Math.sqrt(d2)-player.r; doNear(o); }
      if(o.cy-hh>H+40){ if(!o.scored){addScore(1);o.scored=true;}
        if(o.near && o.minGap<player.r*0.5) perfectDodge(o);
        obstacles.splice(i,1); }
    }

    // Bolzen (Auto-Fire): nach oben, treffen Hindernisse
    for(let bi=bullets.length-1;bi>=0;bi--){ const b=bullets[bi];
      if(b.homing){ steerMissile(b,dt); b.life-=dt; if(b.life<=0){ explodeMissile(b); bullets.splice(bi,1); continue; }
        if(Math.random()<0.6) spawnParticles(b.x,b.y+b.r*0.6,'#ff6a00',1,60); }
      else if(b.frag){ b.life-=dt; if(b.life<=0){ bullets.splice(bi,1); continue; } }
      b.x+=b.vx*dt; b.y+=b.vy*dt;
      if(b.y<-40||b.x<-40||b.x>W+40||b.y>H+60){ bullets.splice(bi,1); continue; }
      let gone=false;
      for(let oi=obstacles.length-1;oi>=0;oi--){ const o=obstacles[oi];
        const er=Math.max(o.w,o.h)*0.5+b.r; const ddx=b.x-o.cx, ddy=b.y-o.cy;
        if(ddx*ddx+ddy*ddy<er*er){
          if(b.homing){ explodeMissile(b); gone=true; break; }
          const hit=rollHit(b.dmg); let dmg=hit.dmg; if(o.slow>0 && mods.brittle) dmg*=1.5;     // Krit + SPRÖDE
          o.hp-=dmg; o.hitFlash=0.12; spawnParticles(b.x,b.y,hit.crit?'#ff3b3b':(b.col||'#caffff'),hit.crit?6:3,hit.crit?180:120);
          if(!b.frag){ floatDamage(o.cx,o.cy-o.h*0.45,dmg,hit.crit); if(hit.crit) beep(1500,0.04,'square',0.1,420); }
          if(b.burn){ o.burn=Math.max(o.burn||0,b.burnDur||1.8); o.burnDmg=Math.max(o.burnDmg||0,b.burn); o.burnSpread=b.burnSpread; o.burnConsume=b.burnConsume; }
          if(b.frost){ const amt=(b.freeze&&Math.random()<0.4)?0.05:b.frost; applySlow(o,b.frostDur||1.4,amt); spawnParticles(b.x,b.y,'#8fe8ff',2,80); }
          if(b.tesla){ chainLightning(o.cx,o.cy,(wpn.chain?wpn.chain.dmg:1.4)*0.8,2,{skip:[o]}); }  // TESLA-SALVE
          if(b.splash) chainAoe(o.cx,o.cy,dmg*0.45);                                       // SPERRFEUER: kleiner Explosions-Splash
          if(o.hp<=0){ const ox=o.cx,oy=o.cy,wasSlow=o.slow>0; if(b.novakill) synNovas.push({x:ox,y:oy}); killObstacle(o); obstacles.splice(oi,1);   // SCHOCK-BOLZEN: Mini-Nova beim Kill
            if(mods.shatter && wasSlow) shatterBurst(ox,oy,b.dmg);                        // SPLITTERBRUCH: Splitter-Explosion
            if(wpn.chain && wpn.chain.onHit) chainLightning(ox,oy,wpn.chain.dmg*0.7,2,{}); } // GEWITTER: Kette auch bei Bolzen-Kill
          if(b.pierce>0){ b.pierce--; } else { gone=true; }
          break;
        }
      }
      // Bolzen/Rakete gegen Mega-Boss
      if(!gone && boss && !boss.dead && !boss.fleeing){ const bdx=b.x-boss.x, bdy=b.y-boss.y, br=boss.r+b.r;
        if(bdx*bdx+bdy*bdy<br*br){
          if(b.homing){ explodeMissile(b); gone=true; }
          else { const h=rollHit(b.dmg); boss.hp-=h.dmg; boss.hitFlash=0.07; spawnParticles(b.x,b.y,h.crit?'#ff3b3b':'#ffe600',h.crit?6:3,150); beep(660,0.03,'square',0.05,120);
            if(!b.frag){ floatDamage(boss.x+rand(-12,12),boss.y-boss.r*0.5,h.dmg,h.crit); if(h.crit) beep(1500,0.04,'square',0.1,420); }
            if(boss.hp<=0) startBossDeath();
            if(b.pierce>0){ b.pierce--; } else gone=true; } } }
      if(gone) bullets.splice(bi,1);
    }

    // Gegner-Kugeln (Mega-Boss)
    for(let i=ebullets.length-1;i>=0;i--){ const e=ebullets[i]; e.x+=e.vx*dt*ts; e.y+=e.vy*dt*ts;
      if(e.x<-40||e.x>W+40||e.y<-40||e.y>H+40){ ebullets.splice(i,1); continue; }
      const dx=player.x-e.x, dy=player.y-e.y, rr=player.r+e.r;
      if(invuln<=0 && dx*dx+dy*dy<rr*rr){ ebullets.splice(i,1); if(hitPlayer('#ff2e88')) return; }
    }

    // Orbs
    for(let i=orbs.length-1;i>=0;i--){ const orb=orbs[i]; orb.y+=orb.vy*dt*ts; orb.pulse+=dt*6;
      const pull=effects.magnet>0?440:mods.magnetPassive;
      if(pull>0){ const dd=Math.hypot(player.x-orb.x,player.y-orb.y), rng=effects.magnet>0?9999:170;
        if(dd<rng&&dd>1){ const a=Math.atan2(player.y-orb.y,player.x-orb.x); orb.x+=Math.cos(a)*pull*dt; orb.y+=Math.sin(a)*pull*dt; } }
      const dx=player.x-orb.x,dy=player.y-orb.y,rr=player.r+orb.r+4;
      if(dx*dx+dy*dy<rr*rr){ combo++; setMult(); refillCombo(); director=Math.min(1,director+0.015); runOrbs++; const g=Math.round(10*multiplier*mods.orbValueMult); addScore(g);
        const oc=(2.2+combo*0.08)*chipMult()*diffChip*(mods.orbValueMult||1); awardCoins(oc,orb.x,orb.y-16);   // Orbs = sichtbare Coins (Dopamin-Quelle)
        spawnParticles(orb.x,orb.y,'#ffcf33',16,240); sfxOrb(combo); beep(1500,0.05,'square',0.12,420); bumpCombo(); vibe(10);
        flash=Math.min(0.5,flash+0.18); flashColor='#ffd23f'; orbs.splice(i,1); continue; }
      if(orb.y>H+20) orbs.splice(i,1);
    }

    // Power-ups
    for(let i=powerups.length-1;i>=0;i--){ const p=powerups[i]; p.y+=p.vy*dt*ts; p.pulse+=dt*5;
      const dx=player.x-p.x,dy=player.y-p.y,rr=player.r+p.r+4;
      if(dx*dx+dy*dy<rr*rr){ collectPup(p); powerups.splice(i,1); continue; }
      if(p.y>H+30) powerups.splice(i,1);
    }

    // Sammel-Symbole (Upgrades & Flüche) – schwebende Items zum Aufsammeln
    gemT-=dt; if(gemT<=0){ if(!bossActive) spawnGem(); gemT=rand(12,20); }
    for(let i=gems.length-1;i>=0;i--){ const g=gems[i]; g.y+=g.vy*dt*ts; g.pulse+=dt*4; g.rot+=dt*1.5;
      const dx=player.x-g.x,dy=player.y-g.y,rr=player.r+g.r+4;
      if(dx*dx+dy*dy<rr*rr){ collectGem(g); gems.splice(i,1); continue; }
      if(g.y>H+30) gems.splice(i,1);
    }

    // Particles & floaters
    pAlive=0; for(const p of particles){ if(p.life<=0) continue; pAlive++; p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.life-=p.decay; }   // Pool: tote Slots ueberspringen, kein splice; lebende zählen
    for(let i=floaters.length-1;i>=0;i--){ const f=floaters[i]; f.y+=f.vy*dt; f.vy*=0.96; if(f.vx){ f.x+=f.vx*dt; f.vx*=0.92; } f.life-=dt*(f.dr||0.9); if(f.life<=0)floaters.splice(i,1); }

    if(banner){ banner.t-=dt; if(banner.t<=0) banner=null; }
    displayScore+=(score-displayScore)*Math.min(1,dt*10);
    accrueChips(false);                                   // Coins laufend verdienen (Live-Guthaben, gedrosselt gespeichert)
    shake=Math.max(0,shake-dt*60); flash=Math.max(0,flash-dt*1.5); nearGlow=Math.max(0,nearGlow-dt*2);
    scoreEl.textContent=fmt(displayScore); comboEl.textContent='x'+multiplier;
    if(coinHud) coinHud.textContent='◈ '+fmt(meta.chips||0);
    const cf=(combo>0&&comboTimeMax>0)?Math.max(0,Math.min(1,comboTime/comboTimeMax)):0;
    comboFillEl.style.transform='scaleX('+cf+')'; comboBarEl.classList.toggle('on',combo>0);
  }

  function doNear(o){ combo+=1+mods.comboBonus; setMult(); refillCombo(); const g=5*multiplier; addScore(g);
    spawnParticles(player.x,player.y,'#ffe600',6,160); sfxNear(); bumpCombo(); vibe(8);
    director=Math.min(1,director+0.025);
    floatText(player.x+rand(-10,10),player.y-20,'+'+g,'#ffe600',14); nearGlow=Math.min(1,nearGlow+0.5); nearCount++;
    unlockAch('firstNear');
    if(nearCount%5===0){ floatText(player.x,player.y-46,pick(P('near')),'#19f0ff',22); shake=Math.max(shake,7); vibe([10,15]);
      awardCoins((2+multiplier*0.6)*chipMult()*diffChip,player.x+22,player.y-26); } }   // Combo-Strähne = Coin-Bündel (auch in BLITZ ohne Orbs)
  // Ultra-knapper Ausweicher → Extra-Bonus
  function perfectDodge(o){ const pb=Math.round(8*multiplier); addScore(pb); combo++; setMult(); refillCombo();
    floatText(player.x,player.y-50,t('perfect'),'#ff2e88',24); beep(1200,0.1,'square',0.2,520);
    flash=Math.min(0.6,flash+0.2); flashColor='#ff2e88'; nearGlow=1; shake=Math.max(shake,8); vibe([12,18,12]);
    director=Math.min(1,director+0.05); spawnParticles(player.x,player.y,'#ff2e88',10,240);
    runPerfect++; if(statN('perfect')+runPerfect>=10) unlockAch('perfect10'); }
  // ---------- Schuss / Explosionen ----------
  // Mündungen: aus den vorstehenden Pixel-Kanten (Nase/Flügel/Kanonen) des aktuellen Schiffs feuern
  let muzIdx=0;
  function shipMuz(){ const m=shipSprite&&shipSprite.muz; return (m&&m.length)?m:[{x:0,y:-((player&&player.r)||12)}]; }
  function muzPrimary(){ const M=shipMuz(); let b=M[0]; for(const m of M) if(m.y<b.y) b=m; return {x:player.x+b.x,y:player.y+b.y}; }
  function muzAt(i){ const M=shipMuz(), m=M[((i%M.length)+M.length)%M.length]; return {x:player.x+m.x,y:player.y+m.y}; }
  function muzSpread(i,n){ const M=shipMuz(); if(n<=1||M.length<=1) return muzPrimary(); const m=M[Math.round(i*(M.length-1)/(n-1))]; return {x:player.x+m.x,y:player.y+m.y}; }
  function fireBlaster(){ const w=wpn.blaster, n=w.bolts, spd=640;
    let teslaShot=false; if(syn.tesla){ teslaCount++; teslaShot=(teslaCount%5===0); }   // TESLA-SALVE: jeder 5. Bolzen verzweigt
    const pyro=syn.pyrobolt, pdot=wpn.flame?wpn.flame.dot:0.9*(mods.wDmgMult||1);                                   // PYRO-BOLZEN: entzünden
    const cryo=syn.cryoshot, camt=wpn.frost?wpn.frost.slowAmt:0.55, cdur=wpn.frost?wpn.frost.slowDur:1.2;            // FROST-SALVE: verlangsamen
    const pcol=pyro?'#ff9a2e':(cryo?'#8fe8ff':'#caffff');
    for(let i=0;i<n;i++){ const ang=(i-(n-1)/2)*w.spread, mp=muzSpread(i,n);
      bullets.push({x:mp.x,y:mp.y,vx:Math.sin(ang)*spd,vy:-Math.cos(ang)*spd,r:5,dmg:w.dmg,pierce:w.pierce,col:pcol,tesla:teslaShot,burn:pyro?pdot:0,burnDur:pyro?1.6:0,frost:cryo?camt:0,frostDur:cryo?cdur:0,splash:syn.barrage,novakill:syn.shockbolt}); }
    const fp=muzPrimary(); emitP(fp.x,fp.y,0,-30,0.14,teslaShot?'#9be7ff':pcol,rand(5,8));
    sfxShoot(); }
  function fireFlame(){ const w=wpn.flame, mp=muzAt(muzIdx++);
    bullets.push({x:mp.x,y:mp.y,vx:rand(-30,30),vy:-560,r:6,dmg:w.dmg,pierce:0,col:'#ffae4d',burn:w.dot,burnDur:w.dur,burnSpread:w.spread,burnConsume:w.consume});
    emitP(mp.x,mp.y,0,-20,0.12,'#ff9a2e',rand(5,9));
    beep(360,0.04,'sawtooth',0.07,90); }
  function fireFrost(){ const w=wpn.frost, mp=muzAt(muzIdx++);
    bullets.push({x:mp.x,y:mp.y,vx:rand(-20,20),vy:-600,r:5,dmg:w.dmg,pierce:1,col:'#8fe8ff',frost:w.slowAmt,frostDur:w.slowDur,freeze:w.freeze,shatter:w.shatter,brittle:w.brittle});
    emitP(mp.x,mp.y,0,-20,0.12,'#8fe8ff',rand(4,7));
    beep(880,0.04,'sine',0.06,240); }
  function fireMissileW(){ const w=wpn.missile; for(let i=0;i<w.count;i++){ const mp=muzSpread(i,w.count);
      bullets.push({x:mp.x+rand(-4,4),y:mp.y,vx:rand(-50,50),vy:-340,r:7,dmg:w.dmg,pierce:0,homing:true,aoe:w.aoe,life:4,col:'#ff9a2e',shrapnel:w.shrapnel,incendiary:w.incendiary}); }
    beep(300,0.05,'square',0.12,160); }
  function fireChainW(){ const w=wpn.chain;
    if(boss&&!boss.dead&&!boss.fleeing){ const dx=boss.x-player.x,dy=boss.y-player.y; if(dx*dx+dy*dy<260*260){
      boss.hp-=w.dmg; boss.hitFlash=0.07; arcParticles(player.x,player.y-player.r,boss.x,boss.y); beep(1200,0.03,'square',0.08,260); if(boss.hp<=0)startBossDeath(); return; } }
    let best=null,bd=99999; for(const o of obstacles){ const dx=o.cx-player.x,dy=o.cy-player.y,d=dx*dx+dy*dy; if(d<bd){bd=d;best=o;} }
    if(!best) return; arcParticles(player.x,player.y-player.r,best.cx,best.cy);
    const h0=rollHit(w.dmg); let dd=h0.dmg; if(syn.super&&best.slow>0) dd*=1.5;
    best.hp-=dd; best.hitFlash=0.1; floatDamage(best.cx,best.cy-best.h*0.4,dd,h0.crit); if(w.stun){ best.slow=Math.max(best.slow||0,w.stun); best.slowAmt=Math.min(best.slowAmt!=null?best.slowAmt:1,0.1); }
    if(syn.wildarc){ best.burn=Math.max(best.burn||0,1.8); best.burnDmg=Math.max(best.burnDmg||0,0.9*(mods.wDmgMult||1)); }   // BRAND-BOGEN
    if(w.aoe) chainAoe(best.cx,best.cy,dd*0.5);
    const fx=best.cx,fy=best.cy,skip=[best]; if(syn.voltspark) synNovas.push({x:fx,y:fy}); if(best.hp<=0){ killObstacle(best); const ix=obstacles.indexOf(best); if(ix>=0)obstacles.splice(ix,1); }
    chainLightning(fx,fy,w.dmg,w.jumps-1,{skip,stun:w.stun,aoe:w.aoe}); beep(1300,0.03,'square',0.06,260); }
  // Nova-Puls: radiale Schockwelle um den Spieler (kein Zielen, Crowd-Control)
  function fireNova(){ const w=wpn.nova, R=w.radius;
    for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-player.x,dy=o.cy-player.y;
      if(dx*dx+dy*dy<R*R){ const h=rollHit(w.dmg); o.hp-=h.dmg; o.hitFlash=0.1; floatDamage(o.cx,o.cy-o.h*0.4,h.dmg,h.crit);
        if(w.slow){ applySlow(o,1.2,0.5); }
        if(syn.embernova){ o.burn=Math.max(o.burn||0,1.8); o.burnDmg=Math.max(o.burnDmg||0,0.85*(mods.wDmgMult||1)); }   // GLUT-NOVA: Puls entzündet
        if(w.knock){ o.cy-=26; }
        if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } }
    if(boss&&!boss.dead&&!boss.fleeing){ const dx=boss.x-player.x,dy=boss.y-player.y; if(dx*dx+dy*dy<(R+boss.r)*(R+boss.r)){ const h=rollHit(w.dmg); boss.hp-=h.dmg; boss.hitFlash=0.07; floatDamage(boss.x,boss.y-boss.r*0.5,h.dmg,h.crit); if(boss.hp<=0) startBossDeath(); } }
    const col=w.slow?'#8fe8ff':'#c45bff';
    if(novas.length>18) novas.shift(); novas.push({x:player.x,y:player.y,r0:14,rMax:R,t:0,life:0.44,col,fill:true});   // Cap + Schockwellen-Ring mit Füll-Blitz
    for(let i=0;i<22;i++){ const a=i/22*6.28, s=R*2.6; emitP(player.x+Math.cos(a)*16,player.y+Math.sin(a)*16,Math.cos(a)*s,Math.sin(a)*s,0.09,col,rand(3,7)); }
    flash=Math.min(0.5,flash+0.16); flashColor=col; shake=Math.max(shake,7); beep(150,0.15,'sine',0.22,210); vibe(11); }
  // VOLTBOGEN: kleine Nova an einem Ketten-Treffer (entkoppelt verarbeitet, damit das Splicen die Kette nicht stört)
  function miniNova(x,y){ const R=56, dmg=(wpn.nova?wpn.nova.dmg*0.5:1.6)*(mods.wDmgMult||1);
    for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-x,dy=o.cy-y;
      if(dx*dx+dy*dy<R*R){ o.hp-=dmg; o.hitFlash=0.1; if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } }
    if(novas.length>18) novas.shift(); novas.push({x,y,r0:6,rMax:R,t:0,life:0.28,col:'#c45bff'});
    for(let i=0;i<7;i++){ const a=i/7*6.28; emitP(x,y,Math.cos(a)*R*2,Math.sin(a)*R*2,0.12,'#c45bff',rand(2,4)); }
    beep(220,0.06,'sine',0.10,160); }
  // Railgun: sofortige Schiene auf die nächste Bedrohung – trifft alle Ziele in der Spalte
  function fireRail(){ const w=wpn.rail; let bx=player.x,bd=1e9;
    for(const o of obstacles){ if(o.cy>player.y) continue; const dx=Math.abs(o.cx-player.x); if(dx<bd){bd=dx;bx=o.cx;} }
    const baseY=player.y-player.r-2;
    for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; if(o.cy>baseY+12) continue;
      if(Math.abs(o.cx-bx)<w.width+(o.w?o.w/2:0)){ const h=rollHit(w.dmg); o.hp-=h.dmg; o.hitFlash=0.12; floatDamage(o.cx,o.cy-o.h*0.4,h.dmg,h.crit);
        if(w.burn){ o.burn=Math.max(o.burn||0,2.0); o.burnDmg=Math.max(o.burnDmg||0,0.9*(mods.wDmgMult||1)); }
        if(syn.cryorail){ applySlow(o,1.5,0.4); }   // FROST-SCHIENE: vereist die Spalte
        if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } }
    if(boss&&!boss.dead&&!boss.fleeing && Math.abs(boss.x-bx)<w.width+boss.r && boss.y<baseY){ const h=rollHit(w.dmg*1.5); boss.hp-=h.dmg; boss.hitFlash=0.07; floatDamage(boss.x,boss.y-boss.r*0.5,h.dmg,h.crit); if(boss.hp<=0) startBossDeath(); }
    if(syn.railnova) synNovas.push({x:bx,y:baseY-40});                                   // SCHIENEN-NOVA: Nova in der Schussspalte
    if(syn.railchain && wpn.chain) chainLightning(bx,baseY-40,wpn.chain.dmg*0.8,wpn.chain.jumps,{});   // SCHIENEN-KETTE
    beams.push({x:bx,w:w.width,t:0.22}); flash=Math.min(0.5,flash+0.16); flashColor='#fff27a'; shake=Math.max(shake,8); beep(110,0.16,'sawtooth',0.32,-50); vibe(10);
    for(let i=0;i<10;i++){ emitP(bx+rand(-w.width,w.width),baseY-rand(0,player.y),0,-rand(60,200),0.18,'#fff27a',rand(2,5)); }   // Mündungs-/Spalten-Funken
    pixelBurst(bx,baseY-6,'#fff7c0',5); }
  function pixelBurst(x,y,color,power){ const n=Math.max(3,Math.round((8+Math.min(20,(power||1)*5))*fxQ)), wn=Math.max(1,Math.round(4*fxQ));   // fxQ: Burst bei Lag kleiner
    for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=rand(80,270); emitP(x,y,Math.cos(a)*s,Math.sin(a)*s,rand(0.02,0.045),color,rand(3,7)); }
    for(let i=0;i<wn;i++){ const a=Math.random()*6.28,s=rand(40,160); emitP(x,y,Math.cos(a)*s,Math.sin(a)*s,0.05,'#ffffff',rand(3,6)); } }
  // Fliegende Fetzen/Chunks mit Schwerkraft (Boss-Splatter „wie ein Luftballon")
  function spawnGibs(x,y,n,cols,spd,grav){ n=Math.max(2,Math.round(n*fxQ));
    for(let i=0;i<n;i++){ if(gibs.length>140) gibs.shift(); const a=Math.random()*6.28, s=rand(spd*0.35,spd);
      gibs.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rand(60,200),rot:Math.random()*6.28,vr:rand(-10,10),size:rand(4,12),color:cols[(Math.random()*cols.length)|0],life:rand(0.8,1.6),grav:grav||520}); } }
  function killObstacle(o){ const pts=3*(o.maxHp||1); addScore(pts);
    pixelBurst(o.cx,o.cy,o.color,o.maxHp); floatText(o.cx,o.cy-12,'+'+pts,o.color,14);
    sfxKill(); flash=Math.min(0.5,flash+0.12); flashColor=o.color; vibe(o.maxHp>=3?[18,14]:6);
    shake=Math.max(shake,o.maxHp>=3?6:3); director=Math.min(1,director+0.008);
    // Power-Up-Drop: Grundchance, von Glück (mods.powerupRate) skaliert, größere Gegner droppen eher
    if(Math.random() < 0.06*(mods.powerupRate||1)*((o.maxHp||1)>=3?1.8:1)) dropPowerup(o.cx,o.cy);
    if(o.burnSpread){ for(const n of obstacles){ if(n===o) continue; const dx=n.cx-o.cx,dy=n.cy-o.cy;  // FLÄCHENBRAND
      if(dx*dx+dy*dy<92*92){ n.burn=Math.max(n.burn||0,1.6); n.burnDmg=Math.max(n.burnDmg||0,(o.burnDmg||0.8)*0.8); n.burnSpread=true; } } } }
  // Lenkrakete: dreht sich zum nächsten Ziel und beschleunigt
  function steerMissile(b,dt){ let tx=null,ty=null,bd=1e9;
    for(const o of obstacles){ const dx=o.cx-b.x,dy=o.cy-b.y,d=dx*dx+dy*dy; if(d<bd){bd=d;tx=o.cx;ty=o.cy;} }
    if(boss&&!boss.dead&&!boss.fleeing){ const dx=boss.x-b.x,dy=boss.y-b.y,d=dx*dx+dy*dy; if(d<bd){bd=d;tx=boss.x;ty=boss.y;} }
    let spd=Math.hypot(b.vx,b.vy)||340; spd=Math.min(560,spd+520*dt);
    if(tx!==null){ const desired=Math.atan2(ty-b.y,tx-b.x), cur=Math.atan2(b.vy,b.vx);
      let dA=((desired-cur+Math.PI*3)%(Math.PI*2))-Math.PI; dA=Math.max(-3.4*dt,Math.min(3.4*dt,dA));
      const na=cur+dA; b.vx=Math.cos(na)*spd; b.vy=Math.sin(na)*spd; }
    else { const m=Math.hypot(b.vx,b.vy)||1; b.vx=b.vx/m*spd; b.vy=b.vy/m*spd; } }
  // Rakete explodiert: AoE-Schaden an allen Zielen im Radius (+ Splitter/Napalm/Eisbombe)
  function explodeMissile(b){ const R=b.aoe||64; const h=rollHit(b.dmg), edmg=h.dmg;
    pixelBurst(b.x,b.y,h.crit?'#ff3b3b':'#ff9a2e',6); spawnParticles(b.x,b.y,'#ffe600',16,300); floatDamage(b.x,b.y,edmg,h.crit);
    flash=Math.min(0.5,flash+0.14); flashColor='#ff9a2e'; shake=Math.max(shake,6); beep(140,0.16,'sawtooth',0.3,-60); vibe([18,12]);
    for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-b.x,dy=o.cy-b.y;
      if(dx*dx+dy*dy<R*R){ o.hp-=edmg; o.hitFlash=0.12;
        if(b.incendiary||syn.napalm){ o.burn=Math.max(o.burn||0,2.2); o.burnDmg=Math.max(o.burnDmg||0,1.0*(mods.wDmgMult||1)); }  // Brandsatz / NAPALM
        if(syn.icebomb){ applySlow(o,1.6,0.45); }                 // EISBOMBE
        if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } }
    if(syn.novabomb) synNovas.push({x:b.x,y:b.y});                  // NOVA-BOMBE: Explosion löst zusätzlich eine Nova aus
    if(syn.clusterarc && wpn.chain) chainLightning(b.x,b.y,wpn.chain.dmg*0.7,wpn.chain.jumps,{});   // CLUSTER-BOGEN: Explosion startet Kettenblitz
    if(b.shrapnel){ for(let i=0;i<8;i++){ const a=i/8*6.28; bullets.push({x:b.x,y:b.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:3,dmg:b.dmg*0.4,pierce:0,col:'#ffd36b',life:0.5,frag:true}); } } // Splittergranate
    if(boss&&!boss.dead&&!boss.fleeing){ const dx=boss.x-b.x,dy=boss.y-b.y; if(dx*dx+dy*dy<(R+boss.r)*(R+boss.r)){ boss.hp-=edmg*2; boss.hitFlash=0.07; floatDamage(boss.x,boss.y-boss.r*0.5,edmg*2,h.crit); if(boss.hp<=0) startBossDeath(); } } }
  // Splitterbruch: gefrorenes Ziel zerspringt beim Tod → Scherben-AoE
  function shatterBurst(x,y,dmg){ const R=70; spawnParticles(x,y,'#bdefff',14,260); beep(900,0.06,'square',0.12,-200); shake=Math.max(shake,5);
    for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-x,dy=o.cy-y;
      if(dx*dx+dy*dy<R*R){ o.hp-=dmg*1.2; o.hitFlash=0.1; if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } } }
  // Kleiner AoE-Puls (Entladung-Fork des Kettenblitzes)
  function chainAoe(x,y,dmg){ const R=46; for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-x,dy=o.cy-y;
      if(dx*dx+dy*dy<R*R){ o.hp-=dmg; o.hitFlash=0.1; if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } } spawnParticles(x,y,'#9be7ff',5,120); }
  // Kettenblitz: springt von Ziel zu Ziel (jumps), +50% an Gefrorenen via SUPRALEITER
  function chainLightning(x,y,dmg,jumps,opts){ opts=opts||{}; let cx=x,cy=y; const used=new Set(opts.skip||[]);
    for(let h=0;h<jumps;h++){ let best=null,bd=185*185; for(const o of obstacles){ if(used.has(o)) continue; const dx=o.cx-cx,dy=o.cy-cy,d=dx*dx+dy*dy; if(d<bd){bd=d;best=o;} }
      if(!best) break; used.add(best); arcParticles(cx,cy,best.cx,best.cy);
      const hh=rollHit(dmg); let dd=hh.dmg; if(syn.super&&best.slow>0) dd*=1.5;
      best.hp-=dd; best.hitFlash=0.1; floatDamage(best.cx,best.cy-best.h*0.4,dd,hh.crit); if(opts.stun){ best.slow=Math.max(best.slow||0,opts.stun); best.slowAmt=Math.min(best.slowAmt!=null?best.slowAmt:1,0.1); }
      if(syn.wildarc){ best.burn=Math.max(best.burn||0,1.8); best.burnDmg=Math.max(best.burnDmg||0,0.9*(mods.wDmgMult||1)); }   // BRAND-BOGEN (je Sprung)
      if(opts.aoe) chainAoe(best.cx,best.cy,dd*0.5);
      const nx=best.cx,ny=best.cy; if(syn.voltspark) synNovas.push({x:nx,y:ny});
      if(best.hp<=0){ killObstacle(best); const ix=obstacles.indexOf(best); if(ix>=0) obstacles.splice(ix,1); }
      cx=nx; cy=ny; } }
  function arcParticles(x1,y1,x2,y2){
    // gezackter Blitz-Bogen: Zwischenpunkte mit seitlichem Versatz → sichtbarer Kettenblitz
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1, nx=-dy/len, ny=dx/len, seg=Math.max(4,Math.min(9,(len/26)|0)), pts=[[x1,y1]];
    for(let i=1;i<seg;i++){ const tt=i/seg, j=(Math.random()-0.5)*Math.min(30,len*0.32); pts.push([x1+dx*tt+nx*j, y1+dy*tt+ny*j]); }
    pts.push([x2,y2]); if(zaps.length>26) zaps.shift(); zaps.push({pts,t:0.15,life:0.15});   // Cap gegen Effekt-Spike
    spawnParticles(x2,y2,'#eaffff',6,150); beep(1100,0.03,'square',0.07,260); }

  function collectPup(p){ sfxPow(); vibe([15,15,15]); spawnParticles(p.x,p.y,PUPINFO[p.type].c,18,240); flash=0.4; flashColor=PUPINFO[p.type].c;
    if(p.type==='shield'){ shields=Math.min(shields+1,5); floatText(p.x,p.y-18,t('pSchild'),'#2effc0',16); }
    else if(p.type==='slow'){ effects.slowmo=5*mods.slowmoMult; floatText(p.x,p.y-18,t('pSlow'),'#5b9bff',16); }
    else if(p.type==='magnet'){ effects.magnet=6; floatText(p.x,p.y-18,t('pMagnet'),'#c45bff',16); }
    else if(p.type==='double'){ effects.double=7; floatText(p.x,p.y-18,t('pDouble'),'#ffe600',16); }
    else if(p.type==='bomb'){ let n=0; for(const o of obstacles){ spawnParticles(o.cx,o.cy,o.color,8,200); n++; addScore(3*multiplier); }
      obstacles=[]; lasers=[]; shake=18; flash=0.6; flashColor='#ff9a2e'; vibe([50,30,50]); banner={text:t('boom'),sub:n+t('boomSub'),t:1.6,color:'#ff9a2e'}; floatText(p.x,p.y-18,t('pBomb'),'#ff9a2e',16); }
  }

  // ---------- Shapes ----------
  function rr(x,y,w,h,r){ ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); }
  function shapePath(sh,w,h){ const hw=w/2,hh=h/2; ctx.beginPath();
    if(sh==='rect'||sh==='long') rr(-hw,-hh,w,h,6);
    else if(sh==='capsule') rr(-hw,-hh,w,h,hh);
    else if(sh==='diamond'){ ctx.moveTo(0,-hh);ctx.lineTo(hw,0);ctx.lineTo(0,hh);ctx.lineTo(-hw,0);ctx.closePath(); }
    else if(sh==='tri'){ ctx.moveTo(0,hh);ctx.lineTo(hw,-hh);ctx.lineTo(-hw,-hh);ctx.closePath(); }
    else if(sh==='hex'){ for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6,x=Math.cos(a)*hw,y=Math.sin(a)*hh; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.closePath(); }
    else if(sh==='star'){ for(let i=0;i<8;i++){const a=Math.PI/4*i,r=i%2?hw*0.45:hw,x=Math.cos(a)*r,y=Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.closePath(); }
  }

  // ---------- Draw ----------
  function draw(){
    const sh=shake*(opt.shake==null?1:opt.shake);
    ctx.save(); if(sh>0) ctx.translate(rand(-sh,sh),rand(-sh,sh));
    lerpBg(bossActive?BOSS_THEME:THEMES[((level||1)-1)%THEMES.length]);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,rgbS(curBg.top)); g.addColorStop(.55,rgbS(curBg.mid)); g.addColorStop(1,rgbS(curBg.bot));
    ctx.fillStyle=g; ctx.fillRect(-40,-40,W+80,H+80);
    drawGrid();
    for(const s of stars){ ctx.globalAlpha=s.z; ctx.fillStyle='#bda4ff'; ctx.fillRect(s.x,s.y,s.r,s.r); } ctx.globalAlpha=1;

    if(state===S.PLAY||state===S.OVER||state===S.UPGRADE||state===S.PAUSE){
      // Railgun-Schienen (eigene, kurz aufleuchtend)
      if(player) for(const bm of beams){ const a=Math.max(0,bm.t/0.22); ctx.save(); ctx.globalCompositeOperation='lighter';
        const grd=ctx.createLinearGradient(bm.x-bm.w*1.3,0,bm.x+bm.w*1.3,0); grd.addColorStop(0,'rgba(255,242,122,0)'); grd.addColorStop(.5,'rgba(255,255,255,'+(0.9*a)+')'); grd.addColorStop(1,'rgba(255,242,122,0)');
        ctx.fillStyle=grd; ctx.fillRect(bm.x-bm.w*1.3,0,bm.w*2.6,player.y);
        ctx.fillStyle='rgba(255,255,255,'+a+')'; ctx.fillRect(bm.x-bm.w*0.28,0,bm.w*0.56,player.y);   // gleißender Kern
        ctx.restore(); }
      // Kettenblitz-Bögen (gezackt, glühend)
      for(const z of zaps){ const a=Math.max(0,z.t/z.life); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath(); ctx.moveTo(z.pts[0][0],z.pts[0][1]); for(let i=1;i<z.pts.length;i++) ctx.lineTo(z.pts[i][0],z.pts[i][1]);
        ctx.strokeStyle='rgba(120,231,255,'+(0.46*a)+')'; ctx.lineWidth=12; ctx.stroke();           // breites weiches Glühen (ersetzt shadowBlur, additiv)
        ctx.strokeStyle='rgba(190,245,255,'+(0.72*a)+')'; ctx.lineWidth=5; ctx.stroke();             // mittlere Schicht
        ctx.strokeStyle='rgba(255,255,255,'+a+')'; ctx.lineWidth=2.5; ctx.stroke();                  // heller Kern
        ctx.restore(); }
      // Nova-Schockwellen-Ringe (expandierend, ausblendend)
      for(const nv of novas){ const p=nv.t/nv.life, r=nv.r0+(nv.rMax-nv.r0)*p, a=Math.max(0,1-p); ctx.save(); ctx.globalCompositeOperation='lighter';
        if(nv.fill){ ctx.fillStyle=hexA(nv.col,0.18*a*(1-p)); ctx.beginPath(); ctx.arc(nv.x,nv.y,r,0,6.28); ctx.fill(); }   // Druckwellen-Füllung (Wumms)
        ctx.strokeStyle=hexA(nv.col,0.5*a); ctx.lineWidth=12*(1-p*0.6); ctx.beginPath(); ctx.arc(nv.x,nv.y,r,0,6.28); ctx.stroke();   // breiter weicher Ring (ersetzt shadowBlur)
        ctx.strokeStyle=hexA(nv.col,0.9*a); ctx.lineWidth=4.5*(1-p*0.6); ctx.beginPath(); ctx.arc(nv.x,nv.y,r,0,6.28); ctx.stroke();
        ctx.strokeStyle=hexA('#ffffff',0.5*a); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(nv.x,nv.y,r*0.92,0,6.28); ctx.stroke();
        ctx.restore(); }
      // Gibs (fliegende Fetzen mit Schatten – Boss-Splatter)
      for(const g of gibs){ const a=Math.min(1,g.life*1.6); ctx.save(); ctx.translate(g.x,g.y); ctx.rotate(g.rot); ctx.globalAlpha=a;
        ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(-g.size*0.5+1.5,-g.size*0.35+1.5,g.size,g.size*0.7);   // billiger Schatten
        ctx.fillStyle=g.color; ctx.fillRect(-g.size*0.5,-g.size*0.35,g.size,g.size*0.7); ctx.restore(); }
      ctx.globalAlpha=1;
      // lasers
      for(const L of lasers){ ctx.save();
        if(L.state==='warn'){ const a=0.25+0.35*Math.abs(Math.sin(L.t*16)); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,230,0,${a})`; ctx.setLineDash([10,10]); ctx.lineWidth=3; ctx.beginPath();
          if(L.orient==='v'){ctx.moveTo(L.pos,0);ctx.lineTo(L.pos,H);}else{ctx.moveTo(0,L.pos);ctx.lineTo(W,L.pos);} ctx.stroke(); }
        else { const fd=1-L.t/L.fireDur;
          const grd=L.orient==='v'?ctx.createLinearGradient(L.pos-L.thick/2,0,L.pos+L.thick/2,0):ctx.createLinearGradient(0,L.pos-L.thick/2,0,L.pos+L.thick/2);
          grd.addColorStop(0,'rgba(255,46,136,0)');grd.addColorStop(.5,`rgba(255,255,255,${0.9*fd})`);grd.addColorStop(1,'rgba(255,46,136,0)'); ctx.fillStyle=grd;
          if(L.orient==='v')ctx.fillRect(L.pos-L.thick/2,0,L.thick,H); else ctx.fillRect(0,L.pos-L.thick/2,W,L.thick); }
        ctx.restore(); }

      // orbs = Coins: Gold-Glow + ◈-Münze (klar als Coin erkennbar)
      if(orbs.length){ const gs=glowSprite('#ffcf33');
        for(const orb of orbs){ const pr=orb.r+Math.sin(orb.pulse)*2, gr=pr*2.8;
          ctx.globalCompositeOperation='lighter'; ctx.drawImage(gs,orb.x-gr,orb.y-gr,gr*2,gr*2); ctx.globalCompositeOperation='source-over';
          ctx.fillStyle='#ffcf33'; ctx.beginPath();ctx.arc(orb.x,orb.y,pr,0,6.28);ctx.fill();
          ctx.fillStyle='#fff3b0'; ctx.beginPath();ctx.arc(orb.x,orb.y,pr*0.78,0,6.28);ctx.fill();
          ctx.fillStyle='#a9710a'; ctx.font='900 '+Math.round(pr*1.5)+'px Orbitron,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('◈',orb.x,orb.y+0.5); }
        ctx.textAlign='start'; ctx.textBaseline='alphabetic'; }

      // power-ups
      for(const p of powerups){ const inf=PUPINFO[p.type], pr=p.r+Math.sin(p.pulse)*2, gr=pr*2.4; ctx.save();
        ctx.globalCompositeOperation='lighter'; ctx.drawImage(glowSprite(inf.c),p.x-gr,p.y-gr,gr*2,gr*2); ctx.globalCompositeOperation='source-over'; // Glow-Sprite statt shadowBlur
        ctx.fillStyle=hexA(inf.c,0.22); ctx.strokeStyle=inf.c; ctx.lineWidth=2.5; ctx.beginPath();ctx.arc(p.x,p.y,pr,0,6.28);ctx.fill();ctx.stroke();
        ctx.fillStyle='#fff'; ctx.font='15px Space Mono, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(inf.g,p.x,p.y+1); ctx.restore(); }

      // sammel-symbole (rotierende raute, gold=positiv, pink=fluch)
      for(const g of gems){ const pr=g.r+Math.sin(g.pulse)*2, col=g.curse?'#ff2e88':'#ffe600', gr=pr*2.4; ctx.save(); ctx.translate(g.x,g.y);
        ctx.globalCompositeOperation='lighter'; ctx.drawImage(glowSprite(col),-gr,-gr,gr*2,gr*2); ctx.globalCompositeOperation='source-over'; // Glow-Sprite statt shadowBlur
        ctx.rotate(g.rot); ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.fillStyle=hexA(col,0.18);
        ctx.beginPath(); ctx.moveTo(0,-pr); ctx.lineTo(pr,0); ctx.lineTo(0,pr); ctx.lineTo(-pr,0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.rotate(-g.rot); ctx.fillStyle='#fff'; ctx.font='15px Space Mono, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(g.u.ico,0,1); ctx.restore(); }

      // obstacles
      for(const o of obstacles){
        if(o.pattern!=='straight'&&o.trail.length){ for(let i=0;i<o.trail.length;i++){ const t=o.trail[i],a=i/o.trail.length;
          ctx.globalAlpha=a*0.28; ctx.fillStyle=o.color; ctx.beginPath(); ctx.arc(t.x,t.y,o.w*0.18*a,0,6.28); ctx.fill(); } ctx.globalAlpha=1; }
        ctx.save(); ctx.translate(o.cx,o.cy); ctx.rotate(o.rot||0);
        const burning=o.burn>0, frozen=o.slow>0, el=elapsed||0;
        const glowCol=burning?(Math.sin(el*34+o.cx)>0?'#ff5a1a':'#ffd24d'):(frozen?'#8fe8ff':o.color);
        const gr=Math.max(o.w,o.h)*(burning?(1.18+Math.sin(el*30+o.cy)*0.16):(frozen?0.95:0.85));   // brennend: pulsierender Feuerschein
        ctx.globalCompositeOperation='lighter'; ctx.drawImage(glowSprite(glowCol),-gr,-gr,gr*2,gr*2); ctx.globalCompositeOperation='source-over';
        const oc=(o.hitFlash>0)?'#ffffff':(frozen?'#bdefff':o.color);
        if(o.shape==='ring'){ ctx.strokeStyle=oc; ctx.lineWidth=o.w*0.26; ctx.beginPath(); ctx.arc(0,0,o.w*0.4,0,6.28); ctx.stroke(); }
        else { ctx.strokeStyle=oc; ctx.lineWidth=o.elite?4:3; ctx.fillStyle=hexA(o.color,o.hitFlash>0?0.4:0.16); shapePath(o.shape,o.w,o.h); ctx.fill(); ctx.stroke(); }
        if(frozen){ const op=Math.min(0.7,0.32+(1-(o.slowAmt!=null?o.slowAmt:1))*0.7);   // tiefer gefroren = dichtere Eiskruste
          ctx.globalAlpha=op; ctx.strokeStyle='#eaffff'; ctx.lineWidth=2; ctx.setLineDash([4,3]);
          if(o.shape==='ring'){ ctx.beginPath(); ctx.arc(0,0,o.w*0.46,0,6.28); ctx.stroke(); } else { shapePath(o.shape,o.w*1.14,o.h*1.14); ctx.stroke(); }
          ctx.setLineDash([]); ctx.globalAlpha=1; }
        if(o.elite){ const er=Math.max(o.w,o.h)*0.62, pw=1+Math.sin((elapsed||0)*6)*0.18;   // Panzer-Telegraph: pulsierender Achteck-Schild
          ctx.strokeStyle=o.hitFlash>0?'#ffffff':'#e6b3ff'; ctx.lineWidth=2.4*pw;
          ctx.beginPath(); for(let k=0;k<8;k++){ const a=k/8*6.28, px=Math.cos(a)*er, py=Math.sin(a)*er; k?ctx.lineTo(px,py):ctx.moveTo(px,py); } ctx.closePath(); ctx.stroke(); }
        ctx.restore();
        // Mini-HP-Balken über angeschlagenen Gegnern (macht Zähigkeit & Schaden lesbar)
        if(o.hp<o.maxHp-0.01 && o.maxHp>1){ const bw=Math.max(18,o.w*0.7), bx=o.cx-bw/2, by=o.cy-o.h*0.5-9, f=Math.max(0,o.hp/o.maxHp);
          ctx.shadowBlur=0; ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx-1,by-1,bw+2,4);
          ctx.fillStyle=f>0.5?'#7cff2e':(f>0.25?'#ffe600':'#ff3b3b'); ctx.fillRect(bx,by,bw*f,2); }
      }

      // bolzen (neon-laser, skin-farbig) & raketen — Glow via Sprite statt shadowBlur
      ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
      for(const b of bullets){
        if(b.homing){ const gr=b.r*4.5; ctx.drawImage(glowSprite('#ff8a2e'),b.x-gr,b.y-gr,gr*2,gr*2);
          ctx.fillStyle='#ff6a00'; ctx.beginPath(); ctx.arc(b.x-b.vx*0.012,b.y-b.vy*0.012,b.r*0.8,0,6.28); ctx.fill();
          ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.28); ctx.fill();
          ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.4,0,6.28); ctx.fill(); }
        else { const gr=b.r*3.4; ctx.drawImage(glowSprite(b.col||'#19f0ff'),b.x-gr,b.y-gr,gr*2,gr*2);
          ctx.strokeStyle=b.col||'#caffff'; ctx.lineWidth=b.r;
          ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x-b.vx*0.022,b.y-b.vy*0.022); ctx.stroke();
          ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.5,0,6.28); ctx.fill(); } }
      ctx.globalCompositeOperation='source-over';

      // mega-boss + gegner-kugeln
      if(boss) drawBoss();
      if(ebullets.length){ const gs=glowSprite('#ff2e88'); ctx.globalCompositeOperation='lighter';
        for(const e of ebullets){ const gr=e.r*3.8; ctx.drawImage(gs,e.x-gr,e.y-gr,gr*2,gr*2); }
        ctx.globalCompositeOperation='source-over';
        for(const e of ebullets){ ctx.fillStyle='#ff5ea8'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,6.28); ctx.fill();
          ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r*0.4,0,6.28); ctx.fill(); } }

      // player trail
      for(let i=0;i<player.trail.length;i++){ const t=player.trail[i],a=i/player.trail.length; ctx.globalAlpha=a*0.5; ctx.fillStyle='#19f0ff'; ctx.beginPath(); ctx.arc(t.x,t.y,player.r*a*0.8,0,6.28); ctx.fill(); } ctx.globalAlpha=1;

      // player (mitwachsendes Pixel-Raumschiff)
      if(state===S.PLAY||state===S.UPGRADE||state===S.PAUSE){ const blink=invuln>0&&Math.floor(invuln*16)%2===0;
        if(!blink) drawShip();
        drawShields();   // Schilde als kompakte HUD-Pips (statt Bubble ums Schiff)
      }

      // particles (additiv -> Funkenregen leuchtet übereinander). Glow via Halo+Kern statt teurem shadowBlur (mobil flüssig)
      ctx.globalCompositeOperation='lighter'; ctx.shadowBlur=0;
      const pHalo=pAlive<140 && fxQ>0.7;   // Halo nur bei wenigen Partikeln & gutem Frame-Budget; bei Last nur Kern = halbe Füllkosten
      for(const p of particles){ if(p.life<=0) continue; const a=p.life, s=p.size; ctx.fillStyle=p.color;
        if(pHalo){ ctx.globalAlpha=a*0.35; ctx.fillRect(p.x-s,p.y-s,s*2,s*2); }     // weicher additiver Halo
        ctx.globalAlpha=a;      ctx.fillRect(p.x-s/2,p.y-s/2,s,s); }               // heller Kern
      ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';

      // floaters
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowBlur=0;
      for(const f of floaters){ const a=Math.max(0,f.life); ctx.font='700 '+f.size+'px Orbitron, sans-serif';
        ctx.globalAlpha=a*0.5; ctx.fillStyle='#000'; ctx.fillText(f.text,f.x+1.5,f.y+1.5);     // billiger Schlagschatten (kein Blur) für Kontrast
        ctx.globalAlpha=a;     ctx.fillStyle=f.color; ctx.fillText(f.text,f.x,f.y); } ctx.globalAlpha=1;

      // effect HUD (top center)
      drawEffectHud();
      if((state===S.PLAY||state===S.UPGRADE||state===S.PAUSE)&&mode!=='zen') drawHearts();
      if(state===S.PLAY||state===S.UPGRADE||state===S.PAUSE) drawArsenalHud();

      // banner
      if(banner){ const a=Math.min(1,banner.t*1.2); ctx.save(); ctx.globalAlpha=a; ctx.textAlign='center';
        ctx.font='900 clamp(22px,6vw,40px) Orbitron, sans-serif'; ctx.shadowBlur=24; ctx.shadowColor=banner.color; ctx.fillStyle='#fff'; ctx.fillText(banner.text,W/2,H*0.32);
        if(banner.sub){ ctx.font='700 clamp(13px,3vw,18px) Orbitron, sans-serif'; ctx.fillStyle=banner.color; ctx.fillText(banner.sub,W/2,H*0.32+34); } ctx.restore(); }
    }

    // vignette (action / combo / near)
    const vig=0.32+Math.min(0.3,(multiplier||1)*0.02)+(nearGlow||0)*0.25;
    const rg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.72);
    rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(1,`rgba(${bossActive?'40,5,5':'10,0,20'},${vig})`); ctx.fillStyle=rg; ctx.fillRect(-40,-40,W+80,H+80);
    if(effects&&effects.slowmo>0){ ctx.fillStyle='rgba(40,80,160,0.10)'; ctx.fillRect(-40,-40,W+80,H+80); }
    // Fluch „Drip aber blind": Sicht-Tunnel um den Spieler
    if(mods&&mods.fog>0&&player&&(state===S.PLAY||state===S.PAUSE||state===S.UPGRADE)){
      const fr=ctx.createRadialGradient(player.x,player.y,player.r*2.4,player.x,player.y,Math.max(W,H)*0.55);
      fr.addColorStop(0,'rgba(4,1,10,0)'); fr.addColorStop(1,`rgba(4,1,10,${mods.fog})`); ctx.fillStyle=fr; ctx.fillRect(-40,-40,W+80,H+80); }
    // Combo-Overdrive: pulsierender Chroma-Schimmer
    if(overdrive&&opt.fx){ const hue=(elapsed||0)*0.7,
      r=Math.floor(128+127*Math.sin(hue)),g2=Math.floor(128+127*Math.sin(hue+2.09)),b=Math.floor(128+127*Math.sin(hue+4.19));
      ctx.fillStyle=`rgba(${r},${g2},${b},${0.05+0.03*(beatPulse||0)})`; ctx.fillRect(-40,-40,W+80,H+80); }
    if(flash>0&&opt.fx){ const m=flashColor.startsWith('#')?hexA(flashColor,flash*0.2):flashColor; ctx.fillStyle=m; ctx.fillRect(-40,-40,W+80,H+80); }
    if(deathFlash>0){ ctx.fillStyle=hexA('#ffffff',Math.min(0.96,deathFlash)); ctx.fillRect(-40,-40,W+80,H+80);   // Nuklearblitz (bildfüllend)
      if(deathFlash<0.7){ ctx.fillStyle=hexA(deathGlow,Math.min(0.42,0.7-deathFlash)); ctx.fillRect(-40,-40,W+80,H+80); } }   // glühender Schein im Abklang (Varianten-Farbe)
    // 😈 Loser-Materialisierung: nach der Explosion fügt sich der Verlierer wieder zusammen
    if(state===S.OVER && deathT>0.5 && opt.fx){ const rev=Math.min(1,(deathT-0.55)/0.55), x=deathX, y=deathY, R=24;
      ctx.save();
      ctx.globalCompositeOperation='lighter';   // einlaufender Glitch-Ring
      for(let i=0;i<16;i++){ const a=i/16*6.28+deathT*2.2, rr=R+(1-rev)*80; ctx.globalAlpha=rev*0.6; ctx.fillStyle=i%2?'#ff2e88':deathGlow;
        ctx.fillRect(x+Math.cos(a)*rr-1.6,y+Math.sin(a)*rr-1.6,3.2,3.2); }
      ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=Math.min(1,rev*1.2);
      const jit=(1-rev)*7, cx=x+rand(-jit,jit), cy=y+rand(-jit,jit);   // Glitch-Zittern bis fertig
      const cg=ctx.createRadialGradient(cx,cy,2,cx,cy,R); cg.addColorStop(0,'#cfc4e6'); cg.addColorStop(1,'rgba(120,110,140,0)');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,R,0,6.28); ctx.fill();
      ctx.font='900 '+Math.round(R*1.35)+'px Orbitron,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(rev>0.92?'😈':'💀',cx,cy);
      // schadenfrohe Spott-Nachricht materialisiert sich
      if(rev>0.45 && deathMsg){ ctx.globalAlpha=Math.min(1,(rev-0.45)/0.4); const gj=(1-rev)*5;
        ctx.font='900 21px Orbitron,sans-serif'; ctx.textBaseline='middle';
        const maxW=W*0.84, words=deathMsg.split(' '); let line='', lines=[];
        for(const w of words){ const tst=line?line+' '+w:w; if(ctx.measureText(tst).width>maxW && line){ lines.push(line); line=w; } else line=tst; } if(line) lines.push(line);
        const lh=26, blockH=lines.length*lh; let sy=y-R-18-blockH+lh/2; if(sy<40+lh/2) sy=y+R+24+lh/2;   // über dem Kern, sonst darunter
        ctx.lineWidth=4; ctx.strokeStyle='rgba(8,2,18,0.85)';
        lines.forEach((ln,k)=>{ const tx=W/2+rand(-gj,gj), ty=sy+k*lh+rand(-gj,gj); ctx.strokeText(ln,tx,ty); ctx.fillStyle='#ff2e88'; ctx.fillText(ln,tx,ty); }); }
      ctx.globalAlpha=1; ctx.textAlign='start'; ctx.textBaseline='alphabetic'; ctx.restore(); }
    // Wahnsinn-Modus: zunehmende Glitch-Scanlines (gestörter Look)
    if(endless&&opt.fx){ const m=Math.min(1,madness);
      for(let i=0;i<3+((m*6)|0);i++){ const yy=Math.random()*H;
        ctx.fillStyle=`rgba(${Math.random()<.5?255:25},${(Math.random()*255)|0},${Math.random()<.5?136:255},${0.05+0.13*m})`;
        ctx.fillRect(-40,yy,W+80,2+Math.random()*7); } }
    ctx.restore();
  }

  const SHIP_ACC=['#ff2e88','#ffe600','#2effc0','#c45bff','#ff9a2e','#7cff2e'];
  const SKINS=[
    {id:'std',  cost:0,   hull:'#16384a',edge:'#19f0ff',acc:'#19f0ff'},
    {id:'pink', cost:300, hull:'#3a0f25',edge:'#ff2e88',acc:'#ff5ea8'},
    {id:'sun',  cost:300, hull:'#3a1f06',edge:'#ff9a2e',acc:'#ffe600'},
    {id:'vapor',cost:600, hull:'#2a0f3a',edge:'#c45bff',acc:'#ff2e88'},
    {id:'toxic',ach:'mega',   hull:'#0f3a1a',edge:'#7cff2e',acc:'#2effc0'},
    {id:'gold', ach:'won',    hull:'#3a3206',edge:'#ffe600',acc:'#fff3a0'},
    {id:'glitch',ach:'madness',hull:'#241a2a',edge:'#ff2e88',acc:'#19f0ff',rnd:true},
    {id:'rainbow',cost:1500,  hull:'#16384a',edge:'#19f0ff',acc:'#19f0ff',rnd:true}
  ];
  const curSkin=()=>SKINS.find(s=>s.id===(meta.skin||'std'))||SKINS[0];
  const SKINTR={
    de:{std:'Standard',pink:'Magenta',sun:'Sonne',vapor:'Vapor',toxic:'Toxisch',gold:'Gold',glitch:'Glitch',rainbow:'Regenbogen'},
    en:{std:'Default',pink:'Magenta',sun:'Sun',vapor:'Vapor',toxic:'Toxic',gold:'Gold',glitch:'Glitch',rainbow:'Rainbow'},
    fr:{std:'Défaut',pink:'Magenta',sun:'Soleil',vapor:'Vapor',toxic:'Toxique',gold:'Or',glitch:'Glitch',rainbow:'Arc-en-ciel'}
  };
  const skinName=id=>((SKINTR[lang]&&SKINTR[lang][id])||SKINTR.en[id]||id);
  const MAXSHIPS=6;
  const shipList=()=>(meta.ships||(meta.ships=[]));
  const activeShip=()=>{ const L=shipList(); return L[meta.shipSlot||0]||L[0]||null; };
  const activeShipCells=()=>{ const s=activeShip(); return (s&&s.cells)||{}; };
  function hasCustomShip(){ const s=activeShip(); return !!(s&&s.cells&&Object.keys(s.cells).length); }
  function buildCustomSprite(r){ return buildSpriteFromCells(activeShipCells(),r); }
  function buildSpriteFromCells(cells,r){ const cp=Math.max(2,Math.round(r*0.31)); cells=cells||{};
    const pad=6*cp, cw=(2*EDHW+1)*cp+pad*2, ch=EDROWS*cp+pad*2, ox=pad+EDHW*cp, oy=pad+((EDROWS-1)/2)*cp;
    const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const x=cv.getContext('2d');
    let maxRow=0, bottomMaxX=0, accCount={}, minRow=99, maxCx=0;
    const drawCell=(fx,fy,c,g)=>{ const px=ox+fx*cp, py=oy+(fy-(EDROWS-1)/2)*cp;
      if(g){ x.save(); x.globalCompositeOperation='lighter'; x.globalAlpha=0.55; const gr=cp*1.7; x.drawImage(glowSprite(c),px-gr,py-gr,gr*2,gr*2); x.restore(); }
      x.fillStyle=c; x.fillRect(px-cp/2,py-cp/2,cp,cp); };
    for(const k in cells){ const p=k.split(','), cx=+p[0], cy=+p[1], cell=cells[k], c=(cell&&cell.c)||cell||'#19f0ff', g=cell&&cell.g?1:0;
      drawCell(cx,cy,c,g); if(cx>0) drawCell(-cx,cy,c,g);
      if(cy>maxRow){ maxRow=cy; bottomMaxX=cx; } else if(cy===maxRow && cx>bottomMaxX) bottomMaxX=cx;
      if(cy<minRow) minRow=cy; if(cx>maxCx) maxCx=cx;
      accCount[c]=(accCount[c]||0)+1; }
    let acc='#19f0ff',best=-1; for(const c in accCount){ if(accCount[c]>best){ best=accCount[c]; acc=c; } }   // häufigste Farbe = Triebwerksglow
    const tailY=(maxRow-(EDROWS-1)/2)*cp+cp*0.5, flameX=bottomMaxX>0?[-bottomMaxX*cp*0.6,bottomMaxX*cp*0.6]:[0];
    const cen=(EDROWS-1)/2, bw=(maxCx+0.6)*cp, bh=(Math.max(maxRow-cen,cen-minRow)+0.6)*cp;   // Pixel-Bounds (für Schild-Form)
    // Mündungen = vorderste vorstehende Pixel je Spalte (Spiegel berücksichtigt)
    const colMin=new Map(), see=(fx,fy)=>{ const v=colMin.get(fx); if(v===undefined||fy<v) colMin.set(fx,fy); };
    for(const k in cells){ const p=k.split(','),cx=+p[0],cy=+p[1]; see(cx,cy); if(cx>0) see(-cx,cy); }
    const muz=[]; colMin.forEach((my,fx)=>{ const l=colMin.get(fx-1),rr=colMin.get(fx+1); if((l===undefined||my<=l)&&(rr===undefined||my<=rr)) muz.push({x:fx*cp,y:(my-(EDROWS-1)/2)*cp-cp*0.6}); });
    muz.sort((a,b)=>a.x-b.x);
    return {cv,ox,oy,cp,acc,flameX,tailY,muz,bw,bh}; }
  function buildShipSprite(r,up,nCan){
    if(meta.skin==='custom' && hasCustomShip()) return buildCustomSprite(r);
    const R=makeRng(shipSeed||1);
    const cp=Math.max(2,Math.round(r*0.31));                 // Pixel-Zellgröße (kleiner)
    const gh=8+Math.min(6,(up*0.42)|0);                      // schlank, etwas kürzer
    const gw=2+Math.min(3,(up*0.22)|0);                      // schmaler Rumpf
    const wingLen=3+Math.min(4,(up*0.38)|0);
    const wingPairs=R()<0.55?2:1;                            // 2 = X-Wing-Silhouette, 1 = schlanker Interceptor
    const sweep=0.55+R()*0.45;                               // Flügel-Pfeilung nach hinten
    const sk=curSkin(), hull=sk.hull, edge=sk.edge, acc=sk.rnd?SHIP_ACC[(R()*SHIP_ACC.length)|0]:sk.acc;
    const pad=(wingLen+4)*cp, cw=(gw*2+1)*cp+pad*2, ch=(gh*2+1)*cp+pad*2, ox=pad+gw*cp, oy=pad+gh*cp;
    const grid=new Map(), setc=(x,y,c)=>{ grid.set(x+','+y,c); grid.set((-x)+','+y,c); };
    // --- Schlanker Rumpf mit langer, spitzer Nase ---
    for(let y=-gh;y<=gh;y++){ const ny=(y+gh)/(2*gh); let hw;
      if(ny<0.34) hw=gw*(ny/0.34);                           // lange spitze Nase
      else if(ny<0.82) hw=gw*(0.45+0.55*((ny-0.34)/0.48));   // Rumpf, sanft breiter
      else hw=gw*(1-0.55*((ny-0.82)/0.18));                  // Heck leicht verjüngt
      hw=Math.max(0,Math.round(hw));
      for(let x=0;x<=hw;x++) setc(x,y,hull);
      setc(hw,y,edge);                                       // Neon-Kante
    }
    // --- Cockpit (hell, vorne) ---
    const cy0=-((gh*0.32)|0); for(let y=cy0;y<=cy0+2;y++) setc(0,y,'#caffff'); setc(0,cy0+1,'#fff');
    // --- mittige Akzent-Linie ---
    for(let y=-((gh*0.06)|0);y<=((gh*0.6)|0);y++) if(grid.has('0,'+y)) setc(0,y,acc);
    // --- Gepfeilte Flügel (X-Wing-Silhouette), je Strebe mit Spitzen-Kanone ---
    const wys = wingPairs===2 ? [((gh*0.06)|0),((gh*0.62)|0)] : [((gh*0.38)|0)];
    for(const wy of wys){
      for(let k=1;k<=wingLen;k++){ const yy=Math.min(gh, wy+Math.round(k*sweep)), xx=gw+k;
        setc(xx,yy,acc); setc(xx,yy-1,edge); }              // Strebe (2px) + Neon-Kante
      const tx=gw+wingLen, ty=Math.min(gh, wy+Math.round(wingLen*sweep));
      setc(tx,ty,'#fff');                                   // Flügelspitze
      for(let k=1;k<=2;k++) setc(tx,ty-1-k,acc);            // Spitzen-Kanone nach vorne
    }
    // --- Frontkanonen (mehr Striche = mehr Waffen) ---
    for(let i=0;i<nCan;i++){ const col=Math.round(((i+0.5)/Math.max(1,nCan)*2-1)*gw), len=2+((R()*2)|0);
      for(let k=0;k<=len;k++) grid.set(col+','+(-gh-1-k), (i%2?'#fff':acc)); }
    // --- Greebles (prozedurale Detailpixel je Run) ---
    const keys=[...grid.keys()]; for(let i=0;i<2+((R()*4)|0);i++){ const p=keys[(R()*keys.length)|0].split(','); setc((+p[0]),(+p[1]), R()<0.5?'#fff':acc); }
    // backen
    const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const x=cv.getContext('2d');
    grid.forEach((c,k)=>{ const p=k.split(','), px=ox+(+p[0])*cp, py=oy+(+p[1])*cp; x.fillStyle=c; x.fillRect(px-cp/2,py-cp/2,cp,cp); });
    const nEng=Math.max(1,Math.min(4,1+((up/3)|0))), flameX=[];
    for(let i=0;i<nEng;i++) flameX.push((i-(nEng-1)/2)*Math.max(cp*1.2,(gw*cp)/Math.max(1,nEng)));
    // Mündungen = vorderste vorstehende Pixel je Spalte (Nase, Flügel-/Kanonenspitzen)
    const colMin=new Map(); let mAbsX=0,mAbsY=0; grid.forEach((c,k)=>{ const p=k.split(','),gx=+p[0],gy=+p[1]; const v=colMin.get(gx); if(v===undefined||gy<v) colMin.set(gx,gy);
      if(Math.abs(gx)>mAbsX) mAbsX=Math.abs(gx); if(Math.abs(gy)>mAbsY) mAbsY=Math.abs(gy); });
    const muz=[]; colMin.forEach((my,gx)=>{ const l=colMin.get(gx-1),rr=colMin.get(gx+1); if((l===undefined||my<=l)&&(rr===undefined||my<=rr)) muz.push({x:gx*cp,y:my*cp-cp*0.6}); });
    muz.sort((a,b)=>a.x-b.x);
    return {cv,ox,oy,cp,acc,flameX,tailY:gh*cp+cp*0.5,muz,bw:(mAbsX+0.6)*cp,bh:(mAbsY+0.6)*cp};
  }
  function drawShip(){ const r=player.r;
    let up=0; for(const k in upgradeCounts) up+=upgradeCounts[k]; up+=ownedCount()*2;
    const nCan=Math.min(8, ownedCount() + (wpn.blaster?Math.max(0,wpn.blaster.bolts-1):0));
    const sig=shipSeed+'|'+up+'|'+nCan+'|'+Math.round(r)+'|'+(meta.skin||'std');
    if(!shipSprite||shipSig!==sig){ shipSprite=buildShipSprite(r,up,nCan); shipSig=sig; }
    const S=shipSprite;
    ctx.save(); ctx.translate(player.x,player.y);
    // Live-Triebwerksflammen am Heck
    ctx.shadowBlur=12; ctx.shadowColor='#ff9a2e';
    for(const fx of S.flameX){ const fl=S.cp*(1.6+2.2*Math.abs(Math.sin((elapsed||0)*28+fx))); ctx.fillStyle='#ffd000';
      ctx.beginPath(); ctx.moveTo(fx-S.cp*0.9,S.tailY); ctx.lineTo(fx+S.cp*0.9,S.tailY); ctx.lineTo(fx,S.tailY+fl); ctx.closePath(); ctx.fill(); }
    // Pixel-Sprite – der Spieler ist der Fokus, glüht am hellsten und pulsiert mit dem Beat
    ctx.shadowBlur=16+(beatPulse||0)*8+(overdrive?6:0); ctx.shadowColor=S.acc; ctx.drawImage(S.cv,-S.ox,-S.oy); ctx.shadowBlur=0;
    if(shields>0) drawShipShield(S);   // Energie-Schild um die Schiffsform
    ctx.restore(); }
  function shieldSil(S){ if(S.sil!==undefined) return S.sil; let o=null;   // schiff-förmige Silhouette in Schildfarbe (Kontur-Aura)
    try{ o=document.createElement('canvas'); o.width=S.cv.width; o.height=S.cv.height; const c=o.getContext('2d');
      c.drawImage(S.cv,0,0); c.globalCompositeOperation='source-in'; c.fillStyle='#2effc0'; c.fillRect(0,0,o.width,o.height); }catch(e){ o=null; } S.sil=o; return o; }
  // Cooles Energie-Schild: Kontur-Aura (hugs Pixelform) + wellige rotierende Ringe + schimmernde Knoten (Annahme: Kontext bereits auf player zentriert)
  function drawShipShield(S){ const t=elapsed||0, col='#2effc0', R0=Math.max(S.bw||player.r,S.bh||player.r)+8;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    // Kontur-Aura: hugs Pixelform (pulsierend)
    const sil=shieldSil(S); if(sil){ const p=0.5+0.5*Math.sin(t*4.2), sc=1.10+0.05*p; ctx.globalAlpha=0.16+0.16*p;
      ctx.drawImage(sil,-S.ox*sc,-S.oy*sc,S.cv.width*sc,S.cv.height*sc); ctx.globalAlpha=1; }
    // konzentrische Schild-Kreise (1 pro Schild) – wie früher, an Schiffsgröße angepasst + Glow + schimmernder Knoten
    for(let s=0;s<shields;s++){ const rad=R0+s*7, rot=t*(0.6+s*0.2)*(s%2?-1:1);
      ctx.shadowBlur=10; ctx.shadowColor=col; ctx.strokeStyle=hexA(col,0.6-s*0.06); ctx.lineWidth=2.2; ctx.beginPath(); ctx.arc(0,0,rad,0,6.28); ctx.stroke();
      ctx.shadowBlur=0; ctx.strokeStyle=hexA('#dffffb',0.3-s*0.03); ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,rad,0,6.28); ctx.stroke();
      const nx=Math.cos(rot)*rad, ny=Math.sin(rot)*rad; ctx.fillStyle=hexA('#dffffb',0.9); ctx.beginPath(); ctx.arc(nx,ny,2.6,0,6.28); ctx.fill(); }
    ctx.shadowBlur=0; ctx.restore(); }
  function drawMouth(m,t){ const y=m.oy, w=m.w, h=w*0.4; ctx.save(); ctx.translate(0,y); ctx.fillStyle='#08010f';
    if(m.type==='grin'){ ctx.strokeStyle='#08010f'; ctx.lineWidth=Math.max(3,h*0.22); ctx.beginPath(); ctx.arc(0,-h*0.2,w*0.5,0.15*Math.PI,0.85*Math.PI); ctx.stroke(); }
    else if(m.type==='o'){ const r=w*0.26*(1+0.2*Math.sin(t*8)); ctx.beginPath(); ctx.arc(0,0,r,0,6.28); ctx.fill(); }
    else if(m.type==='fangs'){ ctx.beginPath(); ctx.ellipse(0,0,w*0.42,h*0.5,0,0,6.28); ctx.fill(); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.moveTo(-w*0.28,-h*0.4); ctx.lineTo(-w*0.16,h*0.55); ctx.lineTo(-w*0.04,-h*0.4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w*0.28,-h*0.4); ctx.lineTo(w*0.16,h*0.55); ctx.lineTo(w*0.04,-h*0.4); ctx.fill(); }
    else { ctx.fillRect(-w*0.45,-h*0.4,w*0.9,h*0.8); ctx.fillStyle='#fff'; for(let i=0;i<5;i++) ctx.fillRect(-w*0.45+i*w*0.18+2,-h*0.4,w*0.06,h*0.8); }
    ctx.restore(); }
  function drawBoss(){ const B=boss, S=B&&B.sp; if(!B||!S) return;
    const tg=B.telegraph?(0.4+0.5*Math.abs(Math.sin(B.warn*22))):0;
    ctx.save(); ctx.translate(B.x,B.y);
    const bz=B.fleeing?0.17:0.07, sc=B.scale||1;   // beim Fliehen: dickes Lach-Wackeln + Wachstum
    const wjx=1+bz*Math.sin(B.t*5), wjy=1+bz*Math.sin(B.t*5+1.6); ctx.scale(wjx*sc,wjy*sc);
    // Tentakel (hinter dem Körper, wedeln)
    for(const t of S.tents){ ctx.strokeStyle=t.col; ctx.lineWidth=S.cp; ctx.lineCap='round'; ctx.shadowBlur=10; ctx.shadowColor=t.col; ctx.beginPath(); ctx.moveTo(t.ox,B.r*0.45);
      for(let s=1;s<=t.len;s++) ctx.lineTo(t.ox+Math.sin(B.t*5+s*0.7+t.ph)*S.cp*1.4,B.r*0.45+s*S.cp*1.3); ctx.stroke(); }
    // Fühler (oben, wippen)
    for(const a of S.ants){ ctx.strokeStyle=a.col; ctx.lineWidth=Math.max(2,S.cp*0.4); ctx.shadowBlur=8; ctx.shadowColor=a.col;
      const tx=a.ox+Math.sin(B.t*4+a.ph)*S.cp*1.6, ty=-B.r*0.55-S.cp*2.6; ctx.beginPath(); ctx.moveTo(a.ox,-B.r*0.42); ctx.lineTo(tx,ty); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(tx,ty,S.cp*0.6,0,6.28); ctx.fill(); }
    // Körper-Sprite (gebacken) mit Neon-Glühen
    if(B.dead && B.style==='meltdown' && B.flick){ ctx.drawImage(S.white,-S.ox,-S.oy); }   // elektrisches Strobe-Flackern
    else { ctx.shadowBlur=22+tg*22; ctx.shadowColor=tg>0?'#ff2e88':S.pal[0]; ctx.drawImage(S.cv,-S.ox,-S.oy); ctx.shadowBlur=0; }
    if(B.hitFlash>0){ ctx.globalAlpha=Math.min(1,B.hitFlash*9); ctx.drawImage(S.white,-S.ox,-S.oy); ctx.globalAlpha=1; }
    // Augen (verfolgen Spieler + blinzeln) & Augenbrauen
    const pa=Math.atan2(player.y-B.y,player.x-B.x), bk=B.blink>0;
    for(const e of S.eyes){ ctx.save(); ctx.translate(e.ox,e.oy);
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(0,0,e.s,bk?e.s*0.12:e.s,0,0,6.28); ctx.fill();
      if(!bk){ ctx.fillStyle='#08010f'; ctx.beginPath(); ctx.arc(Math.cos(pa)*e.s*0.42,Math.sin(pa)*e.s*0.42,e.s*0.46,0,6.28); ctx.fill(); }
      if(S.brows){ ctx.strokeStyle='#08010f'; ctx.lineWidth=Math.max(2,S.cp*0.5); ctx.beginPath(); ctx.moveTo(-e.s,-e.s*1.05); ctx.lineTo(e.s*0.6,-e.s*0.6); ctx.stroke(); }
      ctx.restore(); }
    drawMouth(S.mouth,B.t);
    // Blink-Lichter auf dem Körper
    for(const l of S.lights){ if(Math.floor(B.t*5+l.ph)%2){ ctx.fillStyle='#fff'; ctx.fillRect(l.ox-S.cp*0.4,l.oy-S.cp*0.4,S.cp*0.8,S.cp*0.8); } }
    ctx.restore();
    if(B.fleeing){ ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';   // höhnisches Lach-Emote über dem Boss
      ctx.font='800 24px Orbitron, sans-serif'; ctx.fillStyle='#ffe600'; ctx.shadowBlur=16; ctx.shadowColor='#ff2e88';
      const wob=Math.sin(B.t*1.6)*7;
      ctx.fillText('😂 HA HA HA!', B.x+wob, B.y-B.r*(B.scale||1)*1.25-14); ctx.restore(); }
    // HP-Leiste oben
    if(!B.dead && !B.fleeing){ const bw=Math.min(W*0.66,380), bx=W/2-bw/2, by=(mode!=='zen'?48:30), col=S.pal[0];
      ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='700 12px Orbitron, sans-serif'; ctx.fillStyle=col; ctx.shadowBlur=8; ctx.shadowColor=col;
      ctx.fillText('🛸 '+B.name,W/2,by-10);
      ctx.shadowBlur=0; ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(bx-2,by-2,bw+4,10);
      ctx.fillStyle=col; ctx.fillRect(bx,by,bw*Math.max(0,B.hp/B.maxHp),6); ctx.restore(); }
  }
  function drawHearts(){
    const n=lives; if(!n||n<=0) return;
    const gap=30, y=26; let x=W/2-(n-1)*gap/2;
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='22px Space Mono, monospace';
    ctx.shadowBlur=14; ctx.shadowColor='#ff2e88'; ctx.fillStyle='#ff3b6b';
    for(let i=0;i<n;i++){ ctx.fillText('♥',x,y); x+=gap; }
    ctx.restore();
  }
  function drawShields(){ const n=shields; if(!n) return;          // Schild-Anzeige im HUD (gezeichnete Form statt Emoji → überall sichtbar)
    const gap=24, y=(lives>0&&mode!=='zen')?54:28; let x=W/2-(n-1)*gap/2;
    ctx.save(); ctx.shadowBlur=10; ctx.shadowColor='#2effc0'; ctx.fillStyle='#2effc0'; ctx.strokeStyle='rgba(8,1,15,.7)'; ctx.lineWidth=1.5;
    for(let i=0;i<n;i++){ const s=8;
      ctx.beginPath(); ctx.moveTo(x,y-s); ctx.lineTo(x+s,y-s*0.5); ctx.lineTo(x+s,y+s*0.25);
      ctx.quadraticCurveTo(x+s,y+s,x,y+s*1.3); ctx.quadraticCurveTo(x-s,y+s,x-s,y+s*0.25); ctx.lineTo(x-s,y-s*0.5); ctx.closePath();
      ctx.fill(); ctx.stroke(); x+=gap; }
    ctx.restore();
  }

  function drawEffectHud(){
    const items=[]; if(effects.slowmo>0)items.push(['⏱',effects.slowmo,'#5b9bff',5*mods.slowmoMult]);
    if(effects.magnet>0)items.push(['🧲',effects.magnet,'#c45bff',6]); if(effects.double>0)items.push(['✕2',effects.double,'#ffe600',7]);
    let x=W/2-(items.length*40)/2+20; const y=H-46;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const it of items){ ctx.save(); ctx.font='14px Space Mono'; ctx.fillStyle='#fff'; ctx.shadowBlur=8; ctx.shadowColor=it[2]; ctx.fillText(it[0],x,y-8);
      ctx.shadowBlur=0; ctx.fillStyle=hexA(it[2],0.3); ctx.fillRect(x-16,y+6,32,4); ctx.fillStyle=it[2]; ctx.fillRect(x-16,y+6,32*Math.max(0,it[1]/it[3]),4); ctx.restore(); x+=40; }
  }

  let sunOff=null, sunOffCtx=null, waveOff=null, waveOffCtx=null, sunLo=null, sunLoCtx=null, sunPulse=0;   // Sonne (scharf) + Wellen-Ebene; sunPulse = geglättete Musik-Energie
  function drawGrid(){ const hz=H*0.42,vx=W/2;
    // ---- Audio-reaktiver Sonnen-Puls: Musik-Amplitude (kontinuierlich) + Beat-Puls (scharfe Schläge) ----
    const hasAudio=analyser && !muted;
    if(hasAudio){ analyser.getByteTimeDomainData(waveData);
      let s=0,c=0; for(let i=0;i<waveData.length;i+=4){ s+=Math.abs(waveData[i]-128); c++; }
      const lvl=Math.min(1,(s/c)/38); sunPulse+=(lvl-sunPulse)*0.2; }
    else sunPulse*=0.9;
    const beat=(beatPulse||0), pulse=Math.min(1.2,beat*0.7+sunPulse*0.85);            // Gesamt-Puls fürs Leuchten/Farbe
    const bp=1+beat*0.5+sunPulse*0.7+(overdrive?0.3:0);                                // bp = Beat + Musik-Energie (+Overdrive)
    const gc=curBg.grid, sc=curBg.sun;
    const pc=[Math.min(255,sc[0]+pulse*50),Math.min(255,sc[1]+pulse*62),Math.min(255,sc[2]+pulse*38)]; // Sonnenfarbe dezent heller/wärmer im Takt
    ctx.shadowBlur=0; ctx.strokeStyle=`rgba(${gc[0]|0},${gc[1]|0},${gc[2]|0},${Math.min(0.6,0.24*bp)})`; ctx.lineWidth=1;
    for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(vx+i*40,hz);ctx.lineTo(vx+i*220,H);ctx.stroke();}
    const t=(elapsed||0)*0.5%1;
    for(let i=0;i<14;i++){const f=(i+t)/14,y=hz+Math.pow(f,2.2)*(H-hz); ctx.globalAlpha=Math.min(0.7,(0.1+f*0.25)*bp); ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();} ctx.globalAlpha=1;
    // weicher Halo um die Sonne – dezent, nur leicht im Takt (kein großer Schleier!)
    const hr=200*(0.95+pulse*0.12), ha=Math.min(0.5,0.3+pulse*0.13);
    const sg=ctx.createRadialGradient(W/2,hz,4,W/2,hz,hr); sg.addColorStop(0,`rgba(${sc[0]|0},${sc[1]|0},${sc[2]|0},${ha})`); sg.addColorStop(1,`rgba(${sc[0]|0},${sc[1]|0},${sc[2]|0},0)`); ctx.fillStyle=sg; ctx.fillRect(W/2-hr,hz-hr,hr*2,hr*2);
    // Sonne auf Offscreen-Canvas: SOLIDE Scheibe mit Vertikalverlauf + ausgestanzte Streifen (destination-out)
    const sr=120, sa=Math.min(1,0.85*bp), SS=sr*2, LO=80;
    if(!sunOff){ sunOff=document.createElement('canvas'); sunOff.width=SS; sunOff.height=SS; sunOffCtx=sunOff.getContext('2d');
      waveOff=document.createElement('canvas'); waveOff.width=SS; waveOff.height=SS; waveOffCtx=waveOff.getContext('2d');
      sunLo=document.createElement('canvas'); sunLo.width=LO; sunLo.height=LO; sunLoCtx=sunLo.getContext('2d'); }
    const so=sunOffCtx; so.clearRect(0,0,SS,SS);
    so.save(); so.beginPath(); so.arc(sr,sr,sr,0,6.28); so.clip();
    const dg=so.createLinearGradient(0,0,0,SS);
    dg.addColorStop(0,`rgba(255,244,196,${sa})`);                                                  // heller Kern oben
    dg.addColorStop(0.5,`rgba(${pc[0]|0},${pc[1]|0},${pc[2]|0},${sa})`);                            // pulsende Sonnenfarbe
    dg.addColorStop(1,`rgba(${Math.min(255,sc[0]+30)|0},${(sc[1]*0.45)|0},${(sc[2]*0.7)|0},${sa})`); // satter Richtung Horizont
    so.fillStyle=dg; so.fillRect(0,0,SS,SS);
    so.globalCompositeOperation='destination-out';                                                // Streifen ausstanzen → durchsichtige Lücken
    for(let i=0;i<7;i++){ const yy=sr+6+i*i*3.4; if(yy>SS) break; so.fillRect(0,yy,SS,2.4+i*1.7); }
    so.restore();
    // ---- Audio-Visualizer: bunte Wellenform auf EIGENER Ebene (nur sie wird gebloomt) ----
    const wo=waveOffCtx; wo.clearRect(0,0,SS,SS); const hasWave=hasAudio;            // Visualizer IMMER an – bei Lag nur gröber, nie aus (Daten oben schon geholt)
    if(hasWave){
      const layers=fxQ>0.75?3:(fxQ>0.5?2:1), stepN=fxQ>0.75?2:(fxQ>0.5?3:5);        // unter Last: weniger Layer + gröbere Abtastung
      wo.save(); wo.beginPath(); wo.arc(sr,sr,sr,0,6.28); wo.clip();
      wo.globalCompositeOperation='lighter'; wo.lineWidth=fxQ>0.5?2.7:3.6; wo.lineJoin='round'; wo.lineCap='round'; // gröber = dickere Linie → bleibt gut sichtbar
      const N=waveData.length, midY=sr, amp=sr*0.5*(1+beat*0.35), eh=(elapsed||0)*70;   // begrenzte Amplitude → Welle bleibt IM Sonnenkreis (nicht weggeclippt)
      for(let lay=0;lay<layers;lay++){ const hue=(eh+lay*70)%360;
        wo.strokeStyle=`hsla(${hue},100%,${66-lay*5}%,${0.5-lay*0.09})`;
        wo.beginPath();
        for(let i=0;i<N;i+=stepN){ const x=i/(N-1)*SS, v=(waveData[i]-128)/128, y=midY+v*amp+(lay-1)*6; i?wo.lineTo(x,y):wo.moveTo(x,y); }
        wo.stroke(); }
      wo.restore();
    }
    const dx=W/2-sr, dy=hz-sr;
    ctx.save();
    ctx.drawImage(sunOff,dx,dy);                                                                   // Sonne scharf – KEIN Bloom drauf
    if(hasWave){ ctx.imageSmoothingEnabled=true; ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=1; ctx.drawImage(waveOff,dx,dy);                                             // scharfe Welle
      sunLoCtx.clearRect(0,0,LO,LO); sunLoCtx.drawImage(waveOff,0,0,LO,LO);                         // Downscale NUR der Welle
      ctx.globalAlpha=0.7; ctx.drawImage(sunLo,dx-12,dy-12,SS+24,SS+24);                            // weicher Glow nur um die Welle
      ctx.globalAlpha=0.4; ctx.drawImage(sunLo,dx-24,dy-24,SS+48,SS+48); }
    ctx.restore();
  }

  // ---------- Game Over ----------
  // Zünftiger Abgang: bildfüllende Explosion + Nuklearblitz + Feuer-Konfetti (+ Haptik/Akustik)
  // Explosions-Varianten: jeder Abgang sieht/klingt etwas anders
  const DEATHVARIANTS=[
    {cols:['#ff3b1a','#ff7a1a','#ffd24d','#ffe600','#ffffff'], ring:'#ffffff', glow:'#ff7a1a'},   // Feuer
    {cols:['#ff2e88','#c45bff','#7a5bff','#19f0ff','#ffffff'], ring:'#e6b3ff', glow:'#c45bff'},   // Plasma
    {cols:['#7cff2e','#2effc0','#b6ff3b','#eaffd0','#ffffff'], ring:'#caffd0', glow:'#7cff2e'},   // Toxisch
    {cols:['#19f0ff','#8fe8ff','#bdefff','#caffff','#ffffff'], ring:'#ffffff', glow:'#19f0ff'},   // Eis
    {cols:['#ffd23f','#ff9a2e','#ff5edb','#ffffff','#fff7c0'], ring:'#fff7c0', glow:'#ff9a2e'}    // Sonnensturm
  ];
  function bigDeathBlast(x,y){ const diag=Math.hypot(W,H), V=pick(DEATHVARIANTS), ri=(a,b)=>(rand(a,b)|0);
    deathT=0; deathX=x; deathY=y; deathGather=false; deathGlow=V.glow;
    deathFlash=1; flash=0.95; flashColor='#ffffff'; shake=rand(42,54);
    // ganzes Spielfeld detoniert mit
    for(const o of obstacles){ pixelBurst(o.cx,o.cy,o.color,o.maxHp||2); spawnGibs(o.cx,o.cy,4,V.cols,300,520); }
    obstacles.length=0; lasers.length=0; ebullets.length=0; bullets.length=0;
    // bildfüllende Schockwelle + Feuerball (Größe/Anzahl/Farbe variiert)
    if(novas.length>14) novas.length=0;
    novas.push({x,y,r0:rand(24,40),rMax:diag*rand(1.0,1.22),t:0,life:rand(0.5,0.62),col:V.ring,fill:true});
    for(let i=0;i<5;i++) pixelBurst(x+rand(-36,36),y+rand(-36,36),pick(V.cols),ri(11,16));
    spawnParticles(x,y,V.glow,ri(54,72),rand(480,580)); spawnParticles(x,y,V.cols[2],ri(34,46),rand(380,480)); spawnParticles(x,y,'#ffffff',28,640);
    spawnGibs(x,y,ri(42,62),V.cols,rand(520,620),560);   // Konfetti
    sfxBoom(); sfxDeathBlast(rand(0.8,1.28)); vibe([ri(160,220),50,90,40,ri(140,200),60,ri(200,260)]);
    // gestaffelte Nachbeben-Ringe + Konfetti-Regen (Anzahl/Timing variiert)
    setTimeout(()=>{ if(novas.length<18) novas.push({x,y,r0:rand(8,14),rMax:diag,t:0,life:rand(0.66,0.8),col:V.glow,fill:true}); shake=Math.max(shake,28); beep(ri(58,76),0.5,'sawtooth',0.4,-44); },90+ri(0,50));
    if(Math.random()<0.6) setTimeout(()=>{ if(novas.length<18) novas.push({x,y,r0:6,rMax:diag*0.88,t:0,life:0.8,col:V.cols[1]}); },170+ri(0,60));
    setTimeout(()=>{ spawnGibs(x,rand(H*0.08,H*0.26),ri(28,40),V.cols,rand(440,520),540); deathFlash=Math.max(deathFlash,0.45); },ri(200,260));
    setTimeout(()=>{ for(let k=0;k<4;k++) spawnGibs(rand(W*0.15,W*0.85),rand(-30,H*0.18),ri(14,20),V.cols,rand(380,440),560); },ri(460,560)); }
  function gameOver(){ state=S.OVER; sfxGameOver(); duckMusic(2.4); bigDeathBlast(player.x,player.y);
    const rec=score>curBest(); if(rec){ setBest(score); saveScores();
      for(let i=0;i<5;i++) pixelBurst(rand(W*0.2,W*0.8),rand(H*0.2,H*0.55),pick(['#ffe600','#ff2e88','#19f0ff','#2effc0']),8);
      setTimeout(()=>{beep(660,0.1,'square',0.3);},120); setTimeout(()=>{beep(880,0.1,'square',0.3);},260); setTimeout(()=>{beep(1175,0.18,'square',0.35);},400); }
    accrueChips();                                                         // Score/Near-Chips final live nachbuchen (bereits größtenteils im Run gutgeschrieben)
    const tail=Math.max(0,Math.round((wonThisRun?250:0)*chipMult()*diffChip));   // Sieg-Bonus (Boss-Chips laufen live über awardCoins)
    meta.chips=(meta.chips||0)+tail;
    const earned=runChipsPaid+runChipsEarned+tail;                         // Gesamt-Chips dieses Runs (Trickle + Events + Sieg)
    addStat('orbs',runOrbs); addStat('near',nearCount); addStat('perfect',runPerfect); addStat('bosses',runBosses); addStat('runs',1); addStat('chipsTotal',earned);
    meta.stats=meta.stats||{}; if(runMaxMult>statN('maxCombo')) meta.stats.maxCombo=runMaxMult; if(bossNumber>statN('maxBoss')) meta.stats.maxBoss=bossNumber;
    if(statN('orbs')>=1000) unlockAch('orbs1000'); if(statN('chipsTotal')>=10000) unlockAch('chips10k');
    saveMeta(); updateMenuChips();
    document.getElementById('hud').classList.add('hidden');
    finalScore.textContent=Math.round(score); finalBest.textContent=curBest(); overModeEl.textContent=(daily?(t('modeDaily')+' · '+dailyLabel()):modeLabel(mode))+' · '+(DIFFS[meta.diff||0]||DIFFS[0]).name;
    chipsEarnedEl.textContent=(wonThisRun?t('clearedTag'):'')+'◈ +'+earned+'  ·  '+t('balance')+' ◈ '+(meta.chips||0);
    quipEl.textContent=pick(P('quips')); deathMsg=pick(P('insults')); insultEl.textContent=deathMsg; newrecEl.style.display=rec?'block':'none';   // deathMsg materialisiert sich auch im Canvas-Abgang
    setTimeout(()=>document.getElementById('over').classList.remove('hidden'),1600);   // Explosion erst auswüten lassen
  }

  // ---------- Teilen: Score-Karte als PNG ----------
  function buildShareCanvas(){
    const c=document.createElement('canvas'); c.width=1080; c.height=1080; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,1080); g.addColorStop(0,'#180230'); g.addColorStop(.55,'#1a0a3a'); g.addColorStop(1,'#08010f');
    x.fillStyle=g; x.fillRect(0,0,1080,1080);
    // Perspektiv-Grid unten
    x.strokeStyle='rgba(255,46,136,0.35)'; x.lineWidth=2;
    for(let i=-10;i<=10;i++){ x.beginPath(); x.moveTo(540+i*44,660); x.lineTo(540+i*260,1080); x.stroke(); }
    for(let i=0;i<12;i++){ const f=i/12, y=660+Math.pow(f,2.2)*420; x.globalAlpha=0.12+f*0.3; x.beginPath(); x.moveTo(0,y); x.lineTo(1080,y); x.stroke(); }
    x.globalAlpha=1; x.textAlign='center';
    x.fillStyle='#fff'; x.shadowColor='#ff2e88'; x.shadowBlur=42; x.font='900 110px Orbitron, sans-serif';
    x.fillText('NEONDRIFT',540,196);
    x.shadowBlur=0; x.fillStyle='#9a86c9'; x.font='700 32px Orbitron, sans-serif';
    x.fillText(daily?(t('dailyLbl')+' · '+dailyLabel()):modeLabel(mode),540,256);
    x.fillStyle='#19f0ff'; x.shadowColor='#19f0ff'; x.shadowBlur=46; x.font='900 188px Orbitron, sans-serif';
    x.fillText(String(Math.round(score)),540,432);
    x.shadowBlur=0; x.fillStyle='#ffe600'; x.font='700 38px Orbitron, sans-serif'; x.fillText(t('pointsBig'),540,486);
    x.fillStyle='#c9b9ef'; x.font='400 32px "Space Mono", monospace'; x.fillText(t('record')+' '+curBest(),540,534);
    // genutztes Raumschiff GROSS abbilden (Skin/eigenes Design) – plus Name bei Custom
    try{ let up=0; for(const k in upgradeCounts) up+=upgradeCounts[k]||0; up+=ownedCount()*2;
      const nCan=Math.min(8, ownedCount()+((wpn&&wpn.blaster)?Math.max(0,wpn.blaster.bolts-1):0));
      const S=buildShipSprite(64,up,nCan);
      if(S&&S.cv&&S.cv.width){ const sc=Math.min(300/S.cv.height,650/S.cv.width), dw=S.cv.width*sc, dh=S.cv.height*sc, cyS=760;
        x.save(); x.shadowColor=S.acc||'#19f0ff'; x.shadowBlur=60; x.imageSmoothingEnabled=false; x.drawImage(S.cv,540-dw/2,cyS-dh/2,dw,dh); x.restore();
        if(meta.skin==='custom'){ const s=activeShip(); if(s&&s.name){ x.shadowBlur=0; x.fillStyle='#9be7ff'; x.font='700 30px Orbitron, sans-serif'; x.fillText('« '+s.name+' »',540,Math.min(948,cyS+dh/2+34)); } } }
    }catch(e){}
    x.shadowBlur=0; x.fillStyle='#ff2e88'; x.shadowColor='#ff2e88'; x.shadowBlur=20; x.font='900 50px Orbitron, sans-serif'; x.fillText(t('beatMe'),540,1004);
    x.shadowBlur=0; x.fillStyle='#5b4a85'; x.font='400 30px "Space Mono", monospace'; x.fillText('hannespix.github.io/neondrift',540,1052);
    return c;
  }
  function shareScore(){
    let blobUrl=null;
    try{
      const c=buildShareCanvas();
      const text='NEONDRIFT'+(daily?(' · '+t('dailyLbl')+' '+dailyLabel()):(' · '+modeLabel(mode)))+': '+Math.round(score)+t('shareScore')+'https://hannespix.github.io/neondrift/';
      c.toBlob(blob=>{ if(!blob) return;
        const file=new File([blob],'neondrift-'+Math.round(score)+'.png',{type:'image/png'});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          navigator.share({files:[file],text,title:'NEONDRIFT'}).catch(()=>{});
        } else {
          blobUrl=URL.createObjectURL(blob);
          const a=document.createElement('a'); a.href=blobUrl; a.download=file.name; document.body.appendChild(a); a.click(); a.remove();
          try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text); }catch(e){}
          setTimeout(()=>{ try{ URL.revokeObjectURL(blobUrl); }catch(e){} },5000);
        }
      },'image/png');
    }catch(e){}
  }

  // ---------- Werkstatt (Meta-Shop) ----------
  function updateMenuChips(){ if(menuChipsEl) menuChipsEl.textContent='◈ '+fmt(meta.chips)+((meta.won)?('  ·  🏆 '+meta.won):''); }
  let shopFrom='start';                                  // Werkstatt: aus Menü, Game-Over ODER mitten im Run (Upgrade-/Skill-Screen)
  function runShopLabel(){ return '🛠️ '+t('workshop')+' ◈ '+fmt(meta.chips); }
  function updateRunShopBtns(){ const a=document.getElementById('upgradeShopBtn'), b=document.getElementById('arsenalShopBtn');
    if(a) a.textContent=runShopLabel(); if(b) b.textContent=runShopLabel(); }
  function openShop(from){ const run=(from==='upgrade'||from==='arsenalView'||from==='pause');
    shopFrom=(from==='over')?'over':run?from:'start';
    if(run) accrueChips();                               // Live-Chips frisch, bevor man sie ausgibt
    document.getElementById(shopFrom).classList.add('hidden'); renderShop();
    const sh=document.getElementById('shop'); sh.classList.remove('hidden'); sh.scrollTop=0; sfxUpgrade(); }
  function closeShop(){ document.getElementById('shop').classList.add('hidden');
    document.getElementById(shopFrom).classList.remove('hidden');
    if(shopFrom==='arsenalView') renderArsenalView();    // frisch freigeschaltete Forks sofort wählbar
    else updateRunShopBtns();                            // Button-Guthaben aktualisieren
    updateMenuChips(); }
  const metaById=id=>META.find(m=>m.id===id);
  let shopOpenW={};   // welche Waffen-Accordions im Werkstatt-Waffen-Tab offen sind
  // ---- Info-Tooltip (Touch: Tippen auf ⓘ zeigt lustige Beschreibung; nächster Tipp schließt) ----
  function infoBtn(title,body,extra){ return body?`<span class="infoBtn${extra?' '+extra:''}" data-tt="${encodeURIComponent(title)}" data-tx="${encodeURIComponent(body)}">ⓘ</span>`:''; }
  let tipEl=null;
  function hideTip(){ if(tipEl) tipEl.classList.remove('show'); }
  function showTip(title,body,anchor){ if(!tipEl){ tipEl=document.createElement('div'); tipEl.id='tipPop'; document.body.appendChild(tipEl); }
    tipEl.innerHTML=''; const b=document.createElement('b'); b.textContent=title; tipEl.appendChild(b);
    if(body){ const p=document.createElement('p'); p.textContent=body; tipEl.appendChild(p); }
    tipEl.classList.add('show'); const vw=window.innerWidth||360, tw=Math.min(260,vw-24); tipEl.style.width=tw+'px';
    const r=anchor.getBoundingClientRect(); let left=r.left+r.width/2-tw/2; left=Math.max(12,Math.min(left,vw-tw-12)); tipEl.style.left=left+'px';
    let top=r.top-tipEl.offsetHeight-10; if(top<12) top=r.bottom+10; tipEl.style.top=top+'px'; }
  document.addEventListener('click',e=>{ const ib=e.target.closest&&e.target.closest('.infoBtn');
    if(ib){ e.stopPropagation(); showTip(decodeURIComponent(ib.dataset.tt||''),decodeURIComponent(ib.dataset.tx||''),ib); } else hideTip(); });
  function metaCard(m){ const lvl=metaLvl(m.id), maxed=lvl>=m.max, cost=maxed?0:metaCost(m,lvl), afford=(meta.chips||0)>=cost;
    const card=document.createElement('div'); card.className='ucard'+(maxed?' maxed':'');
    const btn=maxed?'<div class="cost done">MAX</div>':('<button class="cost'+(afford?'':' locked')+'">◈ '+cost+'</button>');
    card.innerHTML=infoBtn(shopName(m),FLAV(m.id),'cardInfo')+'<div class="ico">'+m.ico+'</div><h4>'+shopName(m)+'</h4><p>'+shopDesc(m)+'</p><div class="stack">'+t('level')+' '+lvl+'/'+m.max+'</div>'+btn;
    const b=card.querySelector('button.cost'); if(b) b.addEventListener('click',()=>buyMeta(m.id));
    return card; }
  function shopNode(o){ // o:{ico,title,sub,state:'done'|'buy'|'locked',cost,aff,buy,tip}
    const right = o.state==='done' ? '<span class="wnode-done">✓</span>'
      : o.state==='buy' ? `<button class="cost${o.aff?'':' locked'}" data-buy="${o.buy}">◈ ${o.cost}</button>`
      : '<span class="wnode-lock">🔒</span>';
    return `<div class="wnode ${o.state}"><span class="wni">${o.ico}</span><div class="wnt"><b>${o.title}</b>${o.sub?`<span>${o.sub}</span>`:''}</div>${infoBtn(o.title,o.tip)}${right}</div>`; }
  function weaponAccordion(w){ const id=w.id, bpId='bp_'+id, free=(id==='blaster');
    const owned=free||metaLvl(bpId)>0, fu='fu_'+id, fuLvl=metaLvl(fu), FUM=4, open=!!shopOpenW[id];
    const status=!owned?'🔒':('Lv '+fuLvl+'/4');
    const wrap=document.createElement('div'); wrap.className='waccord'+(open?' open':'')+(owned?'':' notowned');
    let h=`<button class="wahead" style="--wc:${w.col}"><span class="whico">${w.ico}</span><b>${wName(id)}</b>`+
      `<span class="warctag2">${wArch(id)}</span><span class="wstat">${status}</span>${infoBtn(wName(id),FLAV(id))}<span class="wcar">▾</span></button><div class="wabody">`;
    // Bauplan schaltet die Waffe frei (Blaster ist Startwaffe, kostenlos)
    if(free) h+=shopNode({ico:'✦',title:t('startWeapon'),sub:wDesc(id),state:'done',tip:FLAV(id)});
    else { const bl=metaLvl(bpId)>0, cost=metaCost(metaById(bpId),0), aff=(meta.chips||0)>=cost;
      h+=shopNode({ico:'📐',title:t('blueprint'),sub:wDesc(id),state:bl?'done':'buy',cost,aff,buy:bpId,tip:FLAV(bpId)}); }
    // Aufrüst-Stufen als Baum: „<Waffe> Lv 1..4"
    for(let i=0;i<FUM;i++){ h+=`<div class="tconn2"></div>`; const paths=w.forks[i], sub=pName(paths[0])+' / '+pName(paths[1]);
      let st='locked',cost=0,aff=false,buy=null;
      if(fuLvl>i) st='done'; else if(i===fuLvl){ st='buy'; cost=metaCost(metaById(fu),fuLvl); aff=(meta.chips||0)>=cost; buy=fu; }
      const tip=flavTier(id,i)+' '+pName(paths[0])+': '+pDesc(paths[0])+' · '+pName(paths[1])+': '+pDesc(paths[1]);
      h+=shopNode({ico:'⌥',title:wName(id)+' Lv '+(i+1),sub,state:st,cost,aff,buy,tip}); }
    h+='</div>'; wrap.innerHTML=h;
    wrap.querySelector('.wahead').addEventListener('click',e=>{ if(e.target.closest('.infoBtn')) return; shopOpenW[id]=!open; renderShop(); });
    wrap.querySelectorAll('button[data-buy]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); buyMeta(b.dataset.buy); }));
    return wrap; }
  function renderWeaponTab(){ const gen=document.createElement('div'); gen.className='shopRow';
    ['slot','veteran'].forEach(id=>{ const m=metaById(id); if(m) gen.appendChild(metaCard(m)); });
    shopCards.appendChild(gen);
    for(const w of WEAPONS) shopCards.appendChild(weaponAccordion(w)); }
  const weaponBpOwned=id=>id==='blaster'||metaLvl('bp_'+id)>0;
  function synShopRow(s){ const bought=synBought(s.id), pairOk=weaponBpOwned(s.pair[0])&&weaponBpOwned(s.pair[1]);
    const id='sy_'+s.id, cost=metaCost(metaById(id),0), aff=(meta.chips||0)>=cost;
    const sub=WID[s.pair[0]].ico+wName(s.pair[0])+' + '+WID[s.pair[1]].ico+wName(s.pair[1]);
    const st=bought?'done':(pairOk?'buy':'locked');
    const right = bought?'<span class="wnode-done">✓</span>' : pairOk?`<button class="cost${aff?'':' locked'}" data-buy="${id}">◈ ${cost}</button>` : '<span class="wnode-lock">🔒</span>';
    const el=document.createElement('div'); el.className='wnode syn '+st;
    el.innerHTML=`<span class="wni">${s.ico}</span><div class="wnt"><b>${synName(s.id)}</b><span>${st==='locked'?sub:synDesc(s.id)}</span></div>${infoBtn(synName(s.id),FLAV(s.id)+' — '+synDesc(s.id))}${right}`;
    const b=el.querySelector('button[data-buy]'); if(b) b.addEventListener('click',()=>buyMeta(id));
    return el; }
  function renderSynergyTab(){ const rank=s=>synBought(s.id)?2:((weaponBpOwned(s.pair[0])&&weaponBpOwned(s.pair[1]))?0:1);
    SYNERGIES.slice().sort((a,b)=>rank(a)-rank(b)).forEach(s=>shopCards.appendChild(synShopRow(s))); }
  function renderShop(){ shopChipsEl.textContent='◈ '+fmt(meta.chips);
    if(shopHintEl) shopHintEl.textContent='dauerhaft gespeichert · immer teurer & krasser';
    // Tab-Leiste
    const tabsEl=document.getElementById('shopTabs');
    if(tabsEl){ tabsEl.innerHTML=''; SHOPTABS.forEach(([key,ico])=>{ const b=document.createElement('button');
      b.className='shopTab'+(shopTab===key?' on':''); b.textContent=ico+' '+t('cat_'+key);
      b.addEventListener('click',()=>{ shopTab=key; renderShop(); }); tabsEl.appendChild(b); }); }
    shopCards.innerHTML=''; shopCards.classList.toggle('treeCols',shopTab==='weapons'||shopTab==='synergy');
    if(shopTab==='cosmetic'){ skinCards(shopCards); return; }   // Kosmetik-Tab: Skins kaufen/wählen
    if(shopTab==='weapons'){ renderWeaponTab(); return; }       // Waffen-Tab: Accordion-Skilltree pro Waffe
    if(shopTab==='synergy'){ renderSynergyTab(); return; }      // Synergie-Tab: kaufbare Fusionen
    META.filter(m=>shopCat(m.id)===shopTab).forEach(m=>shopCards.appendChild(metaCard(m))); }
  function buyMeta(id){ const m=META.find(x=>x.id===id); if(!m) return; const lvl=metaLvl(id);
    if(lvl>=m.max) return; const cost=metaCost(m,lvl); if((meta.chips||0)<cost){ beep(200,0.12,'square',0.2,-60); return; }
    meta.chips-=cost; meta.lvl=meta.lvl||{}; meta.lvl[id]=lvl+1; saveMeta(); sfxUpgrade(); vibe([15,20,15]); renderShop(); }

  // ---------- Arsenal-Ansicht (In-Run, über Pause: Build ansehen, Waffe ablegen) ----------
  function openArsenalView(){ if(state!==S.PAUSE) return; arsenalSkillMode=false; accrueChips(); renderArsenalView(); const av=document.getElementById('arsenalView'); av.classList.remove('hidden'); av.scrollTop=0; sfxUpgrade(); }
  // Skill-Screen: friert das Spiel ein, zeigt den klickbaren Baum zum Ausgeben der Skillpunkte
  function openSkillScreen(){ arsenalSkillMode=true; state=S.PAUSE; accrueChips(); renderArsenalView(); const av=document.getElementById('arsenalView'); av.classList.remove('hidden'); av.scrollTop=0; sfxUpgrade(); }
  function closeArsenalView(){ document.getElementById('arsenalView').classList.add('hidden');
    if(arsenalSkillMode){ arsenalSkillMode=false; state=S.PLAY; invuln=Math.max(invuln,0.9); lastT=performance.now(); } }
  function dropWeapon(id){ const a=arsenal.w[id];                                  // Ablegen erstattet investierte Skillpunkte (Forks + Waffe), außer Zen/Blaster gratis
    const refund=(mode==='zen')?0:((a?a.lvl-1:0)+((id==='blaster')?0:1));
    delete arsenal.w[id]; if(refund>0) skillPts+=refund; recalcArsenal(); beep(220,0.18,'sawtooth',0.3,-100); vibe([25,20]); renderArsenalView(); }
  // Zuletzt gewählten Fork wieder abwählen → 1 Skillpunkt zurück (jederzeit reskillen)
  function unspendOne(id,slot){ const a=arsenal.w[id]; if(!a||!a[slot]) return; const order=['f1','f2','f3','f4'], ci=order.indexOf(slot);
    if(ci<3 && a[order[ci+1]]) return;   // nur abwählbar, wenn keine höhere Stufe gewählt ist
    const before=Object.assign({},syn), p=a[slot]; a[slot]=null; a.lvl--; skillPts++; recalcArsenal(); sfxPow(); vibe([10,16]);
    banner={text:(wName(id)+' · '+pName(p)).toUpperCase(),sub:'↺ '+t('reskilled')+' (+1 💠)',t:1.3,color:'#ff2e88'}; synBanner(before); renderArsenalView(); }
  // Komplett-Respec einer Waffe: alle Forks zurücksetzen, Punkte gutschreiben
  function respecWeapon(id){ const a=arsenal.w[id]; if(!a) return; let refunded=0; for(const s of ['f1','f2','f3','f4']){ if(a[s]){ a[s]=null; refunded++; } }
    if(!refunded) return; const before=Object.assign({},syn); a.lvl=1; skillPts+=refunded; recalcArsenal(); sfxPow(); vibe([12,18,12]);
    banner={text:wName(id).toUpperCase(),sub:'↺ '+t('reskilled')+' (+'+refunded+' 💠)',t:1.4,color:'#ff2e88'}; synBanner(before); renderArsenalView(); }
  function synBanner(before){ for(const s of SYNERGIES){ if(syn[s.id]&&!before[s.id]){
    banner={text:s.ico+' '+synName(s.id)+' · '+t('synUnlocked'),sub:synDesc(s.id),t:2.8,color:'#ff2e88'};
    if(player) floatText(player.x,player.y-44,s.ico,'#ff2e88',32); flash=Math.min(0.7,(flash||0)+0.3); flashColor='#ff2e88'; } } }
  function afterSpend(){ if(arsenalSkillMode && !hasSkillSpend()) closeArsenalView(); else renderArsenalView(); }
  function spendFork(id,slot,path){ if(skillPts<=0) return; const a=arsenal.w[id]; if(!a||nodeState(id,a,slot,path)!=='avail') return; const before=Object.assign({},syn);
    a[slot]=path; a.lvl++; skillPts--; recalcArsenal(); sfxPow(); vibe(15);
    banner={text:(wName(id)+' · '+pName(path)).toUpperCase(),sub:t('activated'),t:1.4,color:'#19f0ff'}; synBanner(before); afterSpend(); }
  function addWeaponSkill(id){ if(skillPts<=0||arsenal.w[id]||ownedCount()>=arsenal.slots||!weaponUnlocked(id)) return; const before=Object.assign({},syn);
    arsenal.w[id]={lvl:1,f1:null,f2:null,f3:null,f4:null}; skillPts--; recalcArsenal(); sfxPow(); vibe(15);
    banner={text:wName(id).toUpperCase(),sub:t('newWeapon'),t:1.4,color:'#19f0ff'}; synBanner(before); afterSpend(); }
  // Fusions-Slot belegen/wechseln: jederzeit, max MAXSYN. Bei vollem Slot ersetzt der älteste (FIFO) → flüssiges Umschalten.
  function synAvail(id){ const s=SID[id]; return !!(s && synUnlocked(id) && arsenal.w[s.pair[0]] && arsenal.w[s.pair[1]]); }
  function toggleSyn(id){ if(!synAvail(id)) return; const i=activeSyn.indexOf(id);
    if(i>=0){ activeSyn.splice(i,1); }
    else { if(activeSyn.length>=MAXSYN) activeSyn.shift(); activeSyn.push(id); }
    recalcArsenal(); sfxPow(); vibe(12);
    const on=activeSyn.includes(id); banner={text:SID[id].ico+' '+synName(id),sub:on?t('synOn'):t('synNeed'),t:1.2,color:'#ff2e88'};
    renderArsenalView(); }
  // Zustand eines Pfad-Knotens: chosen (gewählt) / avail (als nächstes wählbar) / dim (Geschwister verworfen) / locked (noch nicht erreichbar)
  function nodeState(id,a,slot,path){ const sel=a[slot];
    if(sel===path) return 'chosen';
    if(sel) return 'dim';                       // in diesem Fork wurde schon der andere Pfad gewählt
    const open={f1:true, f2:!!a.f1, f3:!!a.f2, f4:!!a.f3};   // Gabelung erst frei, wenn die vorige gewählt ist
    if(!open[slot]) return 'locked';
    if(!forkShopOpen(id,slot)) return 'shoplocked';         // Reihenfolge ok, aber Fork-Stufe noch nicht in der Werkstatt gekauft
    return 'avail'; }
  function treeNode(id,slot,path){ const a=arsenal.w[id], st=nodeState(id,a,slot,path), can=(st==='avail'&&skillPts>0&&opt.guns);
    const next={f1:'f2',f2:'f3',f3:'f4'}[slot], undoable=(st==='chosen'&&opt.guns&&!(next&&a[next]));   // zuletzt gewählte Stufe → abwählbar (Reskill)
    const hint=can?'<span class="pickhint">+</span>':(st==='shoplocked'?'<span class="pickhint shop">🔒</span>':'');
    const ti={f1:0,f2:1,f3:2,f4:3}[slot]||0, tip=pDesc(path)+' · '+(flavPath(path)||flavTier(id,ti));   // echte Pfad-Beschreibung + Subskill-eigener Spruch
    return `<div class="tnode ${st}${can?' pick':''}${undoable?' undoable':''}" data-wid="${id}" data-slot="${slot}" data-path="${path}" title="${st==='shoplocked'?t('forkLocked'):pDesc(path)}">${infoBtn(pName(path),tip,'tnInfo')}<span class="ti">${PATHICO[path]||'•'}</span><span class="tn">${pName(path)}</span>${hint}</div>`; }
  function renderArsenalView(){ updateRunShopBtns(); const sub=document.getElementById('arsenalViewSub');
    if(sub){ let s=t('slotsLbl')+' '+ownedCount()+'/'+arsenal.slots;
      if(skillPts>0&&opt.guns) s+=' · 💠 '+skillPts+' '+t('skillPts');
      sub.textContent=s+' · '+((skillPts>0&&opt.guns)?t('skillHint'):t('treeHint')); }
    const bb=document.getElementById('arsenalBackBtn'); if(bb) bb.textContent=arsenalSkillMode?t('skillNext'):t('back');
    const wrap=document.getElementById('arsenalCards'); if(!wrap) return; wrap.innerHTML='';
    ownedW().forEach(id=>{ const a=arsenal.w[id], w=WID[id], f1=w.forks[0], f2=w.forks[1], f3=w.forks[2], f4=w.forks[3];
      const card=document.createElement('div'); card.className='wtree';
      card.innerHTML=
        `<div class="wtree-head" style="--wc:${w.col}"><span class="whico">${w.ico}</span><b>${wName(id)}</b><span class="wlv">Lv ${a.lvl}/5</span>${infoBtn(wName(id),FLAV(id))}${a.lvl>1?`<button class="cost respec" title="${t('respec')}">↺</button>`:''}<button class="cost drop">✕</button></div>`+
        `<div class="warctag" style="--wc:${w.col}">${wArch(id)}</div>`+
        `<div class="wmech">${wDesc(id)}</div>`+
        `<div class="tnode base chosen"><span class="ti">${w.ico}</span><span class="tn">L1</span></div>`+
        `<div class="tconn"></div>`+
        `<div class="trow">${treeNode(id,'f1',f1[0])}${treeNode(id,'f1',f1[1])}</div>`+
        `<div class="tconn"></div>`+
        `<div class="trow">${treeNode(id,'f2',f2[0])}${treeNode(id,'f2',f2[1])}</div>`+
        `<div class="tconn"></div>`+
        `<div class="trow">${treeNode(id,'f3',f3[0])}${treeNode(id,'f3',f3[1])}</div>`+
        `<div class="tconn"></div>`+
        `<div class="trow">${treeNode(id,'f4',f4[0])}${treeNode(id,'f4',f4[1])}</div>`;
      card.querySelector('button.drop').addEventListener('click',e=>{ e.stopPropagation(); dropWeapon(id); });
      const rb=card.querySelector('button.respec'); if(rb) rb.addEventListener('click',e=>{ e.stopPropagation(); respecWeapon(id); });
      card.querySelectorAll('.tnode.pick').forEach(n=>n.addEventListener('click',e=>{ if(e.target.closest('.infoBtn')) return; spendFork(n.dataset.wid,n.dataset.slot,n.dataset.path); }));
      card.querySelectorAll('.tnode.undoable').forEach(n=>n.addEventListener('click',e=>{ if(e.target.closest('.infoBtn')) return; unspendOne(n.dataset.wid,n.dataset.slot); }));
      wrap.appendChild(card); });
    const free=arsenal.slots-ownedCount(), notOwned=WEAPONS.filter(w=>!arsenal.w[w.id]);
    const addable=notOwned.filter(w=>weaponUnlocked(w.id)), locked=notOwned.filter(w=>!weaponUnlocked(w.id));
    if(skillPts>0&&opt.guns&&free>0&&addable.length){ addable.forEach(w=>{ const card=document.createElement('div'); card.className='wtree addable';
        card.innerHTML=`<div class="wtree-head" style="--wc:${w.col}"><span class="whico">${w.ico}</span><b>${wName(w.id)}</b>${infoBtn(wName(w.id),FLAV(w.id))}</div>`+
          `<div class="warctag" style="--wc:${w.col}">${wArch(w.id)}</div>`+
          `<div class="tnode base avail"><span class="ti">${w.ico}</span><span class="tn">L1</span></div>`+
          `<p class="adddesc">${wDesc(w.id)}</p>`+
          `<button class="cost addw">➕ ${t('addWeapon')}</button>`;
        card.querySelector('.addw').addEventListener('click',()=>addWeaponSkill(w.id)); wrap.appendChild(card); }); }
    else if(!locked.length){ for(let i=ownedCount();i<arsenal.slots;i++){ const card=document.createElement('div'); card.className='wtree slotEmpty'; card.innerHTML=`<div class="ico">＋</div><p>${t('freeSlot')}</p>`; wrap.appendChild(card); } }
    // Gesperrte Waffen als Teaser zeigen → Anreiz, in der Werkstatt freizuschalten
    if(opt.guns) locked.forEach(w=>{ const card=document.createElement('div'); card.className='wtree wlocked'; card.style.opacity='.5';
        card.innerHTML=`<div class="wtree-head" style="--wc:${w.col}"><span class="whico">${w.ico}</span><b>${wName(w.id)}</b>${infoBtn(wName(w.id),FLAV(w.id))}</div>`+
          `<div class="warctag" style="--wc:${w.col}">${wArch(w.id)}</div>`+
          `<div class="tnode base locked"><span class="ti">🔒</span></div>`+
          `<p class="adddesc">${wDesc(w.id)}</p>`+
          `<div class="cost done">${t('lockedW')}</div>`;
        wrap.appendChild(card); });
    const sd=document.getElementById('arsenalSyn'); if(sd){
      // Fusions-Slots: ALLE Kombis als Info-/Equip-Karten. Antippen = in einen der 2 Slots legen / wieder raus (jederzeit).
      const rows=SYNERGIES.map(s=>{ const a=s.pair[0],b=s.pair[1],hasA=!!arsenal.w[a],hasB=!!arsenal.w[b],owned=(hasA?1:0)+(hasB?1:0);
        const on=syn[s.id], can=synAvail(s.id)&&opt.guns;
        const cls=on?'on':(can?'avail':(owned===1?'near':'off')), tap=(on||can)?' syntap':'';
        const badge=on?'<span class="synok">✓</span>':(can?'<span class="synadd">＋</span>':(owned===1?('<span class="synneed">'+(hasA?WID[b].ico:WID[a].ico)+'</span>'):''));
        const rank=on?3:(can?2:owned);
        return {rank,html:`<div class="synrow ${cls}${tap}" data-syn="${s.id}"><div class="synhead"><span class="synpair">${WID[a].ico}+${WID[b].ico}</span> <b>${synName(s.id)}</b> ${badge}${infoBtn(synName(s.id),FLAV(s.id)+' — '+synDesc(s.id))}</div><div class="synd">${synDesc(s.id)}</div></div>`}; });
      rows.sort((x,y)=>y.rank-x.rank);   // aktiv → wählbar → fast → fehlt
      sd.innerHTML='<h4>'+t('synTitle')+' <span class="synslots">'+activeSyn.length+'/'+MAXSYN+'</span></h4>'+rows.map(r=>r.html).join('');
      sd.querySelectorAll('.synrow.syntap').forEach(r=>r.addEventListener('click',e=>{ if(e.target.closest('.infoBtn')) return; toggleSyn(r.dataset.syn); })); }
  }
  // In-Run HUD: Waffenleiste mit Level-Pips + Synergie-Badges
  function drawArsenalHud(){ const ids=ownedW();
    const y=H-24; let x=14; ctx.textAlign='left'; ctx.textBaseline='middle';
    for(const id of ids){ ctx.font='17px Space Mono, monospace'; ctx.shadowBlur=8; ctx.shadowColor=WID[id].col; ctx.fillStyle='#fff'; ctx.fillText(WID[id].ico,x,y);
      ctx.shadowBlur=0; const lv=arsenal.w[id].lvl; for(let i=0;i<5;i++){ ctx.fillStyle=i<lv?WID[id].col:'rgba(255,255,255,0.16)'; ctx.fillRect(x+1+i*5,y+12,3,3); }
      x+=34; }
    const act=SYNERGIES.filter(s=>syn[s.id]); if(act.length){ x+=4; ctx.font='14px Space Mono, monospace'; for(const s of act){ ctx.shadowBlur=9; ctx.shadowColor='#ff2e88'; ctx.fillStyle='#ff7ab8'; ctx.fillText(s.ico,x,y-1); x+=20; } }
    if(skillPts>0&&opt.guns){ x+=6; ctx.font='700 13px Orbitron, sans-serif'; ctx.shadowBlur=10+(Math.sin((elapsed||0)*5)+1)*4; ctx.shadowColor='#19f0ff'; ctx.fillStyle='#19f0ff'; ctx.fillText('💠'+skillPts,x,y-1); }
    ctx.shadowBlur=0; }
  // ---------- Einstellungen ----------
  function openSettings(){ document.getElementById('start').classList.add('hidden'); renderSettings();
    document.getElementById('settings').classList.remove('hidden'); beep(660,0.06,'square',0.2); }
  function closeSettings(){ document.getElementById('settings').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden'); }
  const OPTLBL={shake:'optShake',fx:'optFx',curses:'optCurses',guns:'optGuns',dmg:'optDmg',lang:'optLang'};
  function renderSettings(){ document.querySelectorAll('#optRows .optrow').forEach(row=>{
    const k=row.dataset.opt; let v;
    if(k==='lang') v=lang.toUpperCase();
    else if(k==='shake') v=(opt.shake===0?t('off'):(opt.shake<1?t('reduced'):t('on')));
    else v=(opt[k]?t('on'):t('off'));
    row.innerHTML=t(OPTLBL[k])+' · <b>'+v+'</b>'; }); renderResetLabels(); }
  function cycleOpt(k){
    if(k==='lang'){ const order=['de','en','fr']; lang=order[(order.indexOf(lang)+1)%3]; saveLang(); applyI18n(); renderSettings(); beep(740,0.06,'square',0.2); return; }
    if(k==='shake') opt.shake=(opt.shake>=1?0.4:(opt.shake>0?0:1));
    else opt[k]=!opt[k];
    saveOpt(); renderSettings(); applyFx(); beep(opt[k]===false?330:740,0.06,'square',0.2); }
  // ---------- Daten zurücksetzen (Teilaspekte + alles), je mit 2-Tap-Bestätigung ----------
  const RESETS={
    workshop:()=>{ meta.chips=0; meta.lvl={}; saveMeta(); updateMenuChips(); },
    scores:()=>{ best={normal:0,hardcore:0,zen:0,daily:0,dailyDate:''}; saveScores(); },
    achskins:()=>{ meta.ach={}; meta.skins={}; meta.skin='std'; saveMeta(); shipSig=''; updateMenuChips(); },
    all:()=>{ try{ ['neondrift_meta','neondrift_best','neondrift_opt','neondrift_lang'].forEach(k=>localStorage.removeItem(k)); }catch(e){} try{ location.reload(); }catch(e){} }
  };
  let resetArmed=null, resetTimer=null;
  function resetLabel(btn){ btn.textContent=t('rs_'+btn.dataset.reset); btn.classList.remove('armed'); }
  function renderResetLabels(){ const rt=document.getElementById('resetTitle'); if(rt) rt.textContent=t('resetTitle');
    document.querySelectorAll('#resetRows .optrow').forEach(resetLabel); resetArmed=null; clearTimeout(resetTimer); }
  function armReset(btn){ const key=btn.dataset.reset;
    if(resetArmed===key){ clearTimeout(resetTimer); resetArmed=null; (RESETS[key]||function(){})();
      if(key!=='all'){ btn.textContent=t('rsDone'); btn.classList.remove('armed'); beep(523,0.12,'square',0.25); vibe([15,20,15]); setTimeout(()=>resetLabel(btn),1100); } }
    else { document.querySelectorAll('#resetRows .optrow').forEach(resetLabel); resetArmed=key; btn.textContent=t('reallyQ'); btn.classList.add('armed'); beep(200,0.1,'square',0.2,-50);
      clearTimeout(resetTimer); resetTimer=setTimeout(()=>{ resetArmed=null; resetLabel(btn); },4000); } }
  // Statische UI-Texte je Sprache setzen
  // ---------- Erfolge-Galerie ----------
  function openAch(){ document.getElementById('start').classList.add('hidden'); renderAch();
    document.getElementById('ach').classList.remove('hidden'); beep(660,0.06,'square',0.2); }
  function closeAch(){ document.getElementById('ach').classList.add('hidden'); document.getElementById('start').classList.remove('hidden'); }
  function renderAch(){ const got=ACH.filter(a=>meta.ach&&meta.ach[a.id]).length, sub=document.getElementById('achSub');
    if(sub) sub.textContent=got+'/'+ACH.length;
    const sp=document.getElementById('achStats');
    if(sp){ const rows=[['runs','🎮',statN('runs')],['orbs','🔷',statN('orbs')],['near','😎',statN('near')],['perfect','🎯',statN('perfect')],['bosses','🛸',statN('bosses')],['maxCombo','🔗','x'+statN('maxCombo')],['maxBoss','🌊',statN('maxBoss')],['chipsTotal','◈',fmt(statN('chipsTotal'))],['won','🏆',meta.won||0]];
      sp.innerHTML='<div class="stHead">'+stTxt('stats')+'</div><div class="stGrid">'+rows.map(r=>'<div class="sttile"><span class="i">'+r[1]+'</span><b>'+(typeof r[2]==='number'?fmt(r[2]):r[2])+'</b><span class="l">'+stTxt(r[0])+'</span></div>').join('')+'</div>'; }
    const wrap=document.getElementById('achCards'); if(!wrap) return; wrap.innerHTML='';
    ACH.forEach(a=>{ const has=!!(meta.ach&&meta.ach[a.id]); const c=document.createElement('div'); c.className='acard'+(has?' got':' lock');
      c.innerHTML='<div class="ico">'+(has?a.ico:'🔒')+'</div><h5>'+achName(a.id)+'</h5><p>'+achDesc(a.id)+'</p>';
      wrap.appendChild(c); }); }
  // ---------- Skins ----------
  // ---------- Pixel-Schiff-Editor ----------
  const EDHW=5, EDROWS=16;                                   // halbe Breite (cx 0..5 → gespiegelt 11 breit) × 16 Zeilen
  const EDPAL=['#19f0ff','#ff2e88','#ffe600','#7cff2e','#c45bff','#ff9a2e','#caffff','#16384a'];
  const ED_TEMPLATES=[
    {name:'Pfeil', d:[[0,2,6],[0,3,0],[0,4,0],[0,5,0],[0,6,0],[0,7,0],[1,5,0],[1,6,0],[1,7,4],[2,7,4],[0,8,1]]},
    {name:'Jäger', d:[[0,2,6],[0,3,0],[0,4,0],[0,5,0],[0,6,0],[1,4,0],[2,5,4],[3,6,4],[1,7,0],[0,7,1]]},
    {name:'Block', d:[[0,3,6],[0,4,0],[0,5,0],[0,6,0],[1,4,0],[1,5,0],[1,6,0],[2,5,0],[0,7,1],[1,7,1]]}
  ];
  let edCells={}, edColor=EDPAL[0], edGlow=false, edErase=false, edPaintActive=false, edGeo=null, edSlot=-1;
  const edUsed=()=>Object.keys(edCells).length;
  function openShipEditor(slot){ const L=shipList(); const exist=(slot!=null&&slot>=0&&L[slot]);
    edSlot = exist ? slot : -1;
    edCells = exist ? JSON.parse(JSON.stringify(L[slot].cells||{})) : {};
    const nm=document.getElementById('edName'); if(nm) nm.value = exist ? (L[slot].name||'') : (t('shipDefault')+' '+(L.length+1));
    edColor=EDPAL[0]; edErase=false; edGlow=false;
    document.getElementById('shop').classList.add('hidden');
    const ed=document.getElementById('shipEditor'); ed.classList.remove('hidden'); ed.scrollTop=0; renderEditor(); sfxUpgrade(); }
  function closeShipEditor(){ document.getElementById('shipEditor').classList.add('hidden');
    document.getElementById('shop').classList.remove('hidden'); renderShop(); }
  function edRefreshBudget(){ const max=pixBudget(), used=edUsed();
    const bd=document.getElementById('edBudget'); if(bd) bd.textContent=t('pixels')+': '+used+'/'+max;
    const fill=document.getElementById('edBudgetFill'); if(fill) fill.style.width=Math.min(100,max?used/max*100:0)+'%'; }
  function renderEditor(){ edRefreshBudget();
    const pal=document.getElementById('edPalette'); if(pal){ pal.innerHTML='';
      EDPAL.forEach(c=>{ const sw=document.createElement('div'); sw.className='sw'+(!edErase&&edColor===c?' on':''); sw.style.background=c; sw.style.color=c;
        sw.addEventListener('click',()=>{ edColor=c; edErase=false; renderEditor(); }); pal.appendChild(sw); });
      const er=document.createElement('div'); er.className='sw eraser'+(edErase?' on':''); er.textContent='⌫';
      er.addEventListener('click',()=>{ edErase=true; renderEditor(); }); pal.appendChild(er); }
    const tools=document.getElementById('edTools'); if(tools){ tools.innerHTML='';
      if(glowUnlocked()){ const g=document.createElement('button'); g.className=edGlow?'buy':''; g.textContent='✨ Glow: '+(edGlow?t('on'):t('off'));
        g.addEventListener('click',()=>{ edGlow=!edGlow; edErase=false; renderEditor(); }); tools.appendChild(g); }
      else { const gm=metaById('pxglow'), cost=metaCost(gm,0), aff=(meta.chips||0)>=cost; const g=document.createElement('button'); g.className='buy'+(aff?'':' lock'); g.textContent='✨ '+t('glowUnlock')+' ◈'+cost;
        g.addEventListener('click',()=>{ buyMeta('pxglow'); renderEditor(); }); tools.appendChild(g); }
      const pm=metaById('pxpack'), lvl=metaLvl('pxpack');
      if(lvl<pm.max){ const cost=metaCost(pm,lvl), aff=(meta.chips||0)>=cost; const p=document.createElement('button'); p.className='buy'+(aff?'':' lock'); p.textContent='➕'+PIX_PER+' '+t('pixels')+' ◈'+cost;
        p.addEventListener('click',()=>{ buyMeta('pxpack'); renderEditor(); }); tools.appendChild(p); } }
    const tpl=document.getElementById('edTemplates'); if(tpl){ tpl.innerHTML='<div class="tplLbl">'+t('templates')+'</div>';
      ED_TEMPLATES.forEach((T,i)=>{ const b=document.createElement('button'); b.textContent=T.name; b.addEventListener('click',()=>loadTemplate(i)); tpl.appendChild(b); }); }
    drawEditorCanvas(); }
  function drawEditorCanvas(){ const cv=document.getElementById('editCanvas'); if(!cv) return; const x=cv.getContext('2d');
    const cols=2*EDHW+1, rows=EDROWS, cell=Math.floor(Math.min(cv.width/cols, cv.height/rows));
    const gw=cols*cell, gh=rows*cell, ox=(cv.width-gw)/2, oy=(cv.height-gh)/2; edGeo={cell,ox,oy,cols,rows};
    x.clearRect(0,0,cv.width,cv.height);
    x.fillStyle='rgba(25,240,255,.05)'; x.fillRect(ox+EDHW*cell,oy,cell,gh);             // Mittelachse (Spiegel)
    x.strokeStyle='rgba(255,255,255,.07)'; x.lineWidth=1;
    for(let c=0;c<=cols;c++){ x.beginPath(); x.moveTo(ox+c*cell+.5,oy); x.lineTo(ox+c*cell+.5,oy+gh); x.stroke(); }
    for(let r2=0;r2<=rows;r2++){ x.beginPath(); x.moveTo(ox,oy+r2*cell+.5); x.lineTo(ox+gw,oy+r2*cell+.5); x.stroke(); }
    for(const k in edCells){ const p=k.split(','),cx=+p[0],cy=+p[1],cl=edCells[k],c=(cl&&cl.c)||cl,g=cl&&cl.g;
      [EDHW+cx,EDHW-cx].forEach(col=>{ const px=ox+col*cell,py=oy+cy*cell;
        if(g){ x.save(); x.shadowBlur=9; x.shadowColor=c; } x.fillStyle=c; x.fillRect(px+1,py+1,cell-2,cell-2); if(g) x.restore(); }); } }
  function edCellAt(clientX,clientY){ const cv=document.getElementById('editCanvas'); if(!cv||!edGeo) return null; const r=cv.getBoundingClientRect();
    const sx=cv.width/r.width, sy=cv.height/r.height, px=(clientX-r.left)*sx, py=(clientY-r.top)*sy;
    const col=Math.floor((px-edGeo.ox)/edGeo.cell), row=Math.floor((py-edGeo.oy)/edGeo.cell);
    if(col<0||col>=edGeo.cols||row<0||row>=edGeo.rows) return null; return {ccx:Math.abs(col-EDHW), row}; }
  function edPaint(ccx,row){ if(ccx<0||ccx>EDHW||row<0||row>=EDROWS) return; const key=ccx+','+row;
    if(edErase){ if(edCells[key]){ delete edCells[key]; drawEditorCanvas(); edRefreshBudget(); } return; }
    const cur=edCells[key]; if(cur && cur.c===edColor && !!cur.g===edGlow) return;
    if(!cur && edUsed()>=pixBudget()){ beep(200,0.1,'square',0.2,-60); vibe(20); return; }   // Budget voll → Pixel-Paket kaufen
    edCells[key]={c:edColor,g:edGlow?1:0}; drawEditorCanvas(); edRefreshBudget(); beep(880,0.02,'square',0.05,200); }
  function loadTemplate(i){ const T=ED_TEMPLATES[i]; if(!T) return; edCells={};
    for(const [cx,cy,ci] of T.d) edCells[cx+','+cy]={c:EDPAL[ci]||EDPAL[0],g:0}; renderEditor(); sfxUpgrade(); }
  function clearCustomEdit(){ edCells={}; drawEditorCanvas(); edRefreshBudget(); beep(300,0.1,'sawtooth',0.2,-80); }
  function saveCustomShip(){ if(!edUsed()){ beep(200,0.12,'square',0.2,-60); return; }
    const L=shipList(); const nmEl=document.getElementById('edName'); const name=((nmEl&&nmEl.value)||'').trim().slice(0,16) || (t('shipDefault')+' '+(L.length+1));
    const ship={name,cells:JSON.parse(JSON.stringify(edCells))};
    let slot=edSlot;
    if(slot>=0 && L[slot]) L[slot]=ship;
    else { if(L.length>=MAXSHIPS){ beep(200,0.12,'square',0.2,-60); return; } L.push(ship); slot=L.length-1; }
    meta.shipSlot=slot; meta.skin='custom'; saveMeta(); shipSig=''; sfxUpgrade(); vibe([15,20,15]); updateMenuChips(); closeShipEditor(); }
  function deleteShip(slot){ const L=shipList(); if(slot<0||slot>=L.length) return; L.splice(slot,1);
    if(meta.shipSlot>=L.length) meta.shipSlot=Math.max(0,L.length-1);
    if(meta.skin==='custom' && !L.length) meta.skin='std';
    saveMeta(); shipSig=''; beep(260,0.12,'sawtooth',0.25,-90); renderShop(); }
  function selectShip(slot){ const L=shipList(); if(!L[slot]) return; meta.shipSlot=slot; selectSkin('custom'); }
  function refreshSkinUIs(){ const sh=document.getElementById('shop'); if(sh&&!sh.classList.contains('hidden')) renderShop(); }
  function selectSkin(id){ meta.skin=id; saveMeta(); shipSig=''; beep(740,0.06,'square',0.2); refreshSkinUIs(); }
  function buySkin(id){ const s=SKINS.find(x=>x.id===id); if(!s||!s.cost) return; if((meta.chips||0)<s.cost){ beep(200,0.12,'square',0.2,-60); return; }
    meta.chips-=s.cost; unlockSkin(id); meta.skin=id; saveMeta(); shipSig=''; sfxUpgrade(); vibe([15,20,15]); refreshSkinUIs(); updateMenuChips(); }
  function skinCards(wrap){ if(!wrap) return; wrap.innerHTML='';
    SKINS.forEach(s=>{ const unlocked=(s.id==='std')||(meta.skins&&meta.skins[s.id])||(!s.ach&&!s.cost), active=(meta.skin||'std')===s.id;
      const card=document.createElement('div'); card.className='skcard'+(active?' act':'');
      const prevBg=s.rnd?'linear-gradient(135deg,#ff2e88,#19f0ff,#ffe600)':s.hull;
      let btn;
      if(active) btn='<div class="pick on">'+t('active')+'</div>';
      else if(unlocked) btn='<button class="pick" data-sk="'+s.id+'" data-act="sel">'+t('choose')+'</button>';
      else if(s.cost){ const aff=(meta.chips||0)>=s.cost; btn='<button class="pick'+(aff?'':' lock')+'" data-sk="'+s.id+'" data-act="buy">◈ '+s.cost+'</button>'; }
      else btn='<div class="pick lock">🏅 '+achName(s.ach)+'</div>';
      card.innerHTML='<div class="prev" style="background:'+prevBg+';border-color:'+s.edge+'"></div><h5>'+skinName(s.id)+'</h5>'+btn;
      const b=card.querySelector('button.pick'); if(b) b.addEventListener('click',()=>{ b.dataset.act==='buy'?buySkin(s.id):selectSkin(s.id); });
      wrap.appendChild(card); });
    // Garage: gespeicherte eigene Schiffe (auswählen/bearbeiten/löschen) + neues Schiff
    const L=shipList();
    L.forEach((s,i)=>{ const active=(meta.skin==='custom' && (meta.shipSlot||0)===i);
      const card=document.createElement('div'); card.className='skcard'+(active?' act':'');
      const cv=document.createElement('canvas'); cv.className='shipPrev'; cv.width=64; cv.height=64;
      const sp=buildSpriteFromCells(s.cells,12), cx=cv.getContext('2d'); const sc=Math.min(56/sp.cv.width,56/sp.cv.height);
      cx.imageSmoothingEnabled=false; cx.drawImage(sp.cv,32-sp.cv.width*sc/2,32-sp.cv.height*sc/2,sp.cv.width*sc,sp.cv.height*sc);
      card.appendChild(cv);
      const h=document.createElement('h5'); h.textContent=s.name||(t('shipDefault')+' '+(i+1)); card.appendChild(h);
      const row=document.createElement('div'); row.className='skrow';
      const pick=document.createElement('button'); pick.textContent=active?t('active'):t('choose'); if(active) pick.className='on'; else pick.addEventListener('click',()=>selectShip(i));
      const ed=document.createElement('button'); ed.textContent='✏️'; ed.title=t('edit'); ed.addEventListener('click',()=>openShipEditor(i));
      const del=document.createElement('button'); del.className='del'; del.textContent='🗑️'; del.title=t('del'); del.addEventListener('click',()=>deleteShip(i));
      row.appendChild(pick); row.appendChild(ed); row.appendChild(del); card.appendChild(row);
      wrap.appendChild(card); });
    if(L.length<MAXSHIPS){ const nc=document.createElement('div'); nc.className='skcard newship'; nc.innerHTML='<div>✏️＋</div><h5 style="font-size:13px;">'+t('newShip')+'</h5>';
      nc.addEventListener('click',()=>openShipEditor(-1)); wrap.appendChild(nc); } }
  function applyI18n(){ try{ document.documentElement.lang=lang;
    const set=(id,v,html)=>{ const e=document.getElementById(id); if(e){ if(html) e.innerHTML=v; else e.textContent=v; } };
    const setSel=(sel,v,html)=>{ const e=document.querySelector(sel); if(e){ if(html) e.innerHTML=v; else e.textContent=v; } };
    const setIco=(id,ico,lbl)=>{ const e=document.getElementById(id); if(e){ e.textContent=ico; e.title=lbl; } };
    set('titleTag',t('tag')); set('dailyBtn',t('daily')); set('shopLbl','🚀 '+t('workshop'));
    setIco('achBtn','🏅',t('achBtn')); setIco('settingsBtn','⚙️',t('settings'));
    setSel('.how',t('how'),true); set('installBtn',t('install')); set('iosHint',t('ios'),true);
    document.querySelectorAll('.mode').forEach(c=>{ const m=c.dataset.mode==='hardcore'?'hard':c.dataset.mode;
      const h=c.querySelector('h3'),p=c.querySelector('p'); if(h)h.textContent=t('m_'+m); if(p)p.textContent=t('m_'+m+'D'); });
    setSel('#pause .utitle',t('pause')); set('resumeBtn',t('resume')); set('pauseMenuBtn',t('mainmenu')); set('arsenalViewBtn',t('arsenalBtn'));
    setSel('#arsenalView .utitle',t('arsenalTitle')); set('arsenalBackBtn',t('back'));
    setSel('#upgrade .utitle',t('chooseUp'));
    setSel('#shop .utitle',t('workshop')); set('balLbl',t('balance')); set('shopBackBtn',t('back'));
    setSel('#settings .utitle',t('setTitle')); set('setHint',t('tapToggle')); set('settingsBackBtn',t('back'));
    setSel('#ach .utitle',t('achTitle')); set('achBackBtn',t('back'));
    setSel('#over .gover',t('crash')); set('newrec',t('newRec')); set('againBtn',t('again')); set('overShopBtn','🚀 '+t('workshop')); set('shareBtn',t('share')); set('menuBtn',t('menu'));
    const lbls=document.querySelectorAll('#over .scorebox .lbl'); if(lbls[0])lbls[0].textContent=t('points'); if(lbls[1])lbls[1].textContent=t('record');
    if(typeof renderSettings==='function') renderSettings();
  }catch(e){} }

  // ---------- Loop ----------
  function loop(now){ let dt=(now-lastT)/1000; lastT=now; if(dt>0.05)dt=0.05;
    frameMs+=((dt*1000)-frameMs)*0.1;                                                              // geglättete Frame-Zeit (EMA)
    if(frameMs>27) fxQ=Math.max(0.4,fxQ-0.05); else if(frameMs<19) fxQ=Math.min(1,fxQ+0.02);       // <37fps: FX runter · >52fps: wieder hoch
    if(state===S.PLAY) update(dt);
    else { elapsed=(elapsed||0)+dt; for(const s of stars){s.y+=(20+s.z*40)*dt;if(s.y>H){s.y=-2;s.x=Math.random()*W;}}
      if(particles)for(const p of particles){if(p.life<=0)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.life-=p.decay;}
      // Abgangs-FX nachlaufen lassen (update() läuft im OVER-State nicht): Feuer-Konfetti, Schockwellen, Nuklearblitz
      for(let i=gibs.length-1;i>=0;i--){ const g=gibs[i]; g.x+=g.vx*dt; g.y+=g.vy*dt; g.vy+=g.grav*dt; g.vx*=0.99; g.rot+=g.vr*dt; g.life-=dt; if(g.life<=0||g.y>H+50) gibs.splice(i,1); }
      for(let i=novas.length-1;i>=0;i--){ novas[i].t+=dt; if(novas[i].t>=novas[i].life) novas.splice(i,1); }
      deathFlash=Math.max(0,(deathFlash||0)-dt*1.5); flash=Math.max(0,(flash||0)-dt*1.5);
      if(state===S.OVER){ deathT+=dt;   // Loser-Materialisierung: nach der Explosion sammeln sich Partikel ein
        if(deathT>0.55 && !deathGather){ deathGather=true;
          for(let i=0;i<26;i++){ const a=i/26*6.28; emitP(deathX+Math.cos(a)*95,deathY+Math.sin(a)*95,-Math.cos(a)*150,-Math.sin(a)*150,0.62,i%2?deathGlow:'#caffff',rand(3,5)); }
          sfxMaterialize(); } }
      shake=Math.max(0,(shake||0)-dt*60); }
    if(achToasts.length){ achToasts[0].t-=dt; if(achToasts[0].t<=0) achToasts.shift(); }
    // Bei offenem Vollbild-Overlay (Upgrade/Skill-Baum/Pause) den Canvas einfrieren:
    // sonst rendert die Szene 60fps unter dem Backdrop-Blur weiter → mehrere Sekunden Lag auf Mobil.
    if(state===S.UPGRADE||state===S.PAUSE){ requestAnimationFrame(loop); return; }
    draw(); drawAchToast(); requestAnimationFrame(loop);
  }
  function drawAchToast(){ if(!achToasts.length) return; const a=achToasts[0], id=a.id, al=Math.min(1,a.t,3.4-a.t+0.6);
    const w=Math.min(W*0.86,360), x=W/2-w/2, y=Math.max(54,H*0.12);
    ctx.save(); ctx.globalAlpha=Math.max(0,al);
    ctx.fillStyle='rgba(8,1,15,0.85)'; ctx.strokeStyle='#ffe600'; ctx.lineWidth=2; ctx.shadowBlur=16; ctx.shadowColor='#ffe600';
    ctx.beginPath(); rr(x,y,w,52,12); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.font='26px Space Mono, monospace'; ctx.fillStyle='#fff'; ctx.fillText(((ACH.find(z=>z.id===id)||{}).ico)||'🏅',x+16,y+27);
    ctx.font='700 13px Orbitron, sans-serif'; ctx.fillStyle='#ffe600'; ctx.fillText(t('achGot'),x+52,y+16);
    ctx.font='700 15px Orbitron, sans-serif'; ctx.fillStyle='#fff'; ctx.fillText(achName(id),x+52,y+36);
    ctx.restore(); }

  // ---------- DOM ----------
  const scoreEl=document.getElementById('score'),comboEl=document.getElementById('combo'),bestHud=document.getElementById('best-hud'),coinHud=document.getElementById('coinHud'),
        finalScore=document.getElementById('finalScore'),finalBest=document.getElementById('finalBest'),quipEl=document.getElementById('quip'),
        newrecEl=document.getElementById('newrec'),modeNameEl=document.getElementById('modeName'),overModeEl=document.getElementById('overMode'),
        zenExitBtn=document.getElementById('zenExit'),upgradeCards=document.getElementById('upgradeCards'),upgradeSub=document.getElementById('upgradeSub'),
        titleTag=document.getElementById('titleTag'),insultEl=document.getElementById('insult'),
        pauseSub=document.getElementById('pauseSub'),
        comboBarEl=document.getElementById('comboBar'),comboFillEl=comboBarEl.querySelector('i'),
        menuChipsEl=document.getElementById('menuChips'),shopChipsEl=document.getElementById('shopChips'),shopHintEl=document.getElementById('shopHint'),
        shopCards=document.getElementById('shopCards'),chipsEarnedEl=document.getElementById('chipsEarned');
  function updateDiffLabel(){ const e=document.getElementById('diffName'); if(e) e.textContent=(DIFFS[meta.diff||0]||DIFFS[0]).name; }
  { const db=document.getElementById('diffBtn'); if(db){ updateDiffLabel();
    db.addEventListener('click',()=>{ meta.diff=((meta.diff||0)+1)%DIFFS.length; saveMeta(); updateDiffLabel(); sfxPow(); vibe(8); }); } }
  document.querySelectorAll('.mode').forEach(c=>c.addEventListener('click',()=>startGame(c.dataset.mode)));
  document.getElementById('dailyBtn').addEventListener('click',()=>startGame('daily'));
  document.getElementById('shopBtn').addEventListener('click',()=>openShop('start'));
  document.getElementById('overShopBtn').addEventListener('click',()=>openShop('over'));
  document.getElementById('shopBackBtn').addEventListener('click',closeShop);
  document.getElementById('shopCloseBtn').addEventListener('click',closeShop);
  // Pixel-Schiff-Editor: Buttons + Mal-Eingabe
  { const g=id=>document.getElementById(id);
    if(g('edBackBtn')) g('edBackBtn').addEventListener('click',closeShipEditor);
    if(g('edSaveBtn')) g('edSaveBtn').addEventListener('click',saveCustomShip);
    if(g('edClearBtn')) g('edClearBtn').addEventListener('click',clearCustomEdit);
    const ecv=g('editCanvas'); if(ecv){ const pp=e=>{ e.preventDefault(); const c=edCellAt(e.clientX,e.clientY); if(c) edPaint(c.ccx,c.row); };
      ecv.addEventListener('pointerdown',e=>{ edPaintActive=true; try{ecv.setPointerCapture(e.pointerId);}catch(_){} pp(e); });
      ecv.addEventListener('pointermove',e=>{ if(edPaintActive) pp(e); });
      ecv.addEventListener('pointerup',()=>{ edPaintActive=false; }); ecv.addEventListener('pointercancel',()=>{ edPaintActive=false; }); ecv.addEventListener('pointerleave',()=>{ edPaintActive=false; }); } }
  document.getElementById('achBtn').addEventListener('click',openAch);
  document.getElementById('achBackBtn').addEventListener('click',closeAch);
  document.getElementById('achCloseBtn').addEventListener('click',closeAch);
  document.getElementById('settingsBtn').addEventListener('click',openSettings);
  document.getElementById('settingsBackBtn').addEventListener('click',closeSettings);
  document.getElementById('settingsCloseBtn').addEventListener('click',closeSettings);
  document.querySelectorAll('#optRows .optrow').forEach(row=>row.addEventListener('click',()=>cycleOpt(row.dataset.opt)));
  document.querySelectorAll('#resetRows .optrow').forEach(b=>b.addEventListener('click',()=>armReset(b)));
  document.getElementById('againBtn').addEventListener('click',()=>startGame());
  document.getElementById('menuBtn').addEventListener('click',toMenu);
  document.getElementById('shareBtn').addEventListener('click',shareScore);
  applyI18n(); updateMenuChips();
  zenExitBtn.addEventListener('click',pauseGame);
  document.getElementById('resumeBtn').addEventListener('click',resumeGame);
  document.getElementById('pauseMenuBtn').addEventListener('click',toMenu);
  const av=document.getElementById('arsenalViewBtn'); if(av) av.addEventListener('click',openArsenalView);
  const avc=document.getElementById('arsenalCloseBtn'); if(avc) avc.addEventListener('click',closeArsenalView);
  const avb=document.getElementById('arsenalBackBtn'); if(avb) avb.addEventListener('click',closeArsenalView);
  const usb=document.getElementById('upgradeShopBtn'); if(usb) usb.addEventListener('click',()=>openShop('upgrade'));
  const asb=document.getElementById('arsenalShopBtn'); if(asb) asb.addEventListener('click',()=>openShop('arsenalView'));
  const psb=document.getElementById('pauseShopBtn'); if(psb) psb.addEventListener('click',()=>openShop('pause'));
  const muteBtn=document.getElementById('mute');
  muteBtn.addEventListener('click',()=>{ muted=!muted; muteBtn.textContent=muted?'🔇':'🔊';
    if(masterGain) masterGain.gain.value=muted?0:0.9; if(!muted){ unlockAudio(); } });
  let lastKey='';
  const isOpen=id=>{ const e=document.getElementById(id); return e&&!e.classList.contains('hidden'); };
  window.addEventListener('keydown',e=>{ if(e.code==='Escape'){
      if(isOpen('arsenalView')){ closeArsenalView(); return; }
      if(isOpen('shipEditor')){ closeShipEditor(); return; }
      if(state===S.PLAY) pauseGame(); else if(state===S.PAUSE) resumeGame(); else if(state!==S.MENU) toMenu(); }
    else if((e.code==='Space'||e.code==='Enter')&&state===S.OVER){e.preventDefault();startGame();}
    if(e.key==='7'&&lastKey==='6') trigger67(); lastKey=e.key; });
  document.addEventListener('visibilitychange',()=>{ lastT=performance.now();
    if(document.hidden){
      if(state===S.PLAY) pauseGame();           // im Hintergrund nicht unbemerkt sterben
      if(actx && actx.state==='running'){ try{ actx.suspend(); }catch(e){} } // Musik & SFX anhalten (auch im Browser)
    } else {
      if(actx && actx.state==='suspended' && !muted){ try{ actx.resume(); }catch(e){} }
    }
  });
  setInterval(()=>{ if(state===S.MENU) titleTag.textContent=pick(P('crazy')); },3200);
  // (Menü spielt jetzt den eigenen Chill-Track NEON CHILL – keine Song-Rotation mehr im Menü)

  clearParticles(); floaters=[]; obstacles=[]; orbs=[]; powerups=[]; lasers=[]; bullets=[]; ebullets=[]; boss=null; gems=[]; beams=[]; zaps=[]; novas=[]; gibs=[];
  multiplier=1; combo=0; nearGlow=0; flash=0; shake=0; bossActive=false; elapsed=0;
  effects={slowmo:0,magnet:0,double:0}; shields=0; invuln=0;
  requestAnimationFrame(loop);
})();

/* NEONDRIFT – Spiellogik. Siehe CLAUDE.md fuer Architektur. */
(() => {
  "use strict";
  const canvas=document.getElementById('c'), ctx=canvas.getContext('2d');
  const S={MENU:0,PLAY:1,UPGRADE:2,OVER:3,PAUSE:4};
  let state=S.MENU, mode='normal';
  let DPR=Math.min(window.devicePixelRatio||1,2), W=0, H=0, lastT=0;

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
      m_normal:'NORMAL', m_normalD:'Levels, neue Formen, Boss-Wellen, Upgrade-Karten & Power-Ups. Das volle Programm.',
      m_hard:'HARDCORE', m_hardD:'Keine Orbs. Brutal schnell. Nur Mut, Near-Misses & Power-Ups retten dich.',
      m_zen:'ZEN', m_zenD:'Kein Tod. Treffer kostet nur Combo. Entspannt sammeln, Highscore jagen.',
      pause:'PAUSE', resume:'▶ WEITER', mainmenu:'☰ HAUPTMENÜ', chooseUp:'UPGRADE WÄHLEN', arsenal:'🔫 ARSENAL', level:'Level',
      newWeapon:'NEUE WAFFE', path:'PFAD', slotsLbl:'Slots', synTitle:'Synergien', noSyn:'— noch keine —', drop:'ablegen', lockedW:'🔒 Werkstatt', equipHint:'Tippen zum Aus-/Einrüsten', loadoutTitle:'🎒 LOADOUT', arsenalTitle:'🎒 ARSENAL', freeSlot:'frei', loadoutBtn:'🎒 LOADOUT', arsenalBtn:'🎒 ARSENAL', synUnlocked:'SYNERGIE!',
      balance:'Guthaben', shopHint:'dauerhaft gespeichert · immer teurer & krasser', back:'← ZURÜCK', resetAll:'♻ ALLES ZURÜCKSETZEN', reallyQ:'WIRKLICH? ✓ (tippen)',
      setTitle:'EINSTELLUNGEN', tapToggle:'Tippen zum Umschalten', optShake:'Screenshake', optFx:'Bildschirm-Effekte', optCurses:'🎲 Lustige Flüche', optGuns:'🔫 Schießen / Waffen', optLang:'🌐 Sprache',
      on:'AN', off:'AUS', reduced:'REDUZIERT', activated:'aktiviert', crash:'CRASH', points:'Punkte', record:'Rekord', newRec:'★ NEUER REKORD ★', again:'NOCHMAL', share:'📤 TEILEN', menu:'MENÜ', best:'BEST',
      lvl:'LEVEL', newForm:'Neue Form: ', faster:'Schneller & dichter!', bossWave:'⚠ BOSS-WELLE ', megaBoss:'🛸 MEGA-BOSS', endgegner:'👾 DER ENDGEGNER', finaleSub:'überlebe das Inferno!',
      survived:'ÜBERLEBT!', defeated:'BESIEGT! 💥', escaped:'🛸 ENTKOMMEN…', escapedSub:'die Beute ist weg!', armUp:'Rüste auf für den Boss · Level ',
      overdrive:'⚡ OVERDRIVE', overdriveSub:'du brennst!', enrage:'🔥 ENRAGE!', enrageSub:'es dreht völlig durch!',
      beaten:'🏆 DURCHGESPIELT!', beatenSub:'…aber es hört nicht auf.', madness:'☣ WAHNSINN-MODUS', madnessSub:'wie weit kommst du?', clearedTag:'🏆 DURCHGESPIELT!  ·  ',
      shieldGone:'SCHILD WEG!', comboGoneZ:'COMBO WEG', lifeLost:'−1 ♥', livesLeft:' ♥ ÜBRIG', comboOut:'COMBO AUS', perfect:'PERFEKT! 🎯', daily2:'🗓 DAILY',
      pSchild:'SCHILD', pSlow:'SLOW-MO', pMagnet:'MAGNET', pDouble:'PUNKTE ✕2', pBomb:'BOMBE', boom:'BOOM!', boomSub:' pulverisiert', curseTag:'🎲 FLUCH',
      shareScore:' Punkte! Schlag mich 🔥 ', beatMe:'SCHLAG MICH. 🔥', pointsBig:'PUNKTE', dailyLbl:'TÄGLICH', modeDaily:'TÄGLICH',
      achBtn:'🏅 ERFOLGE', achTitle:'ERFOLGE', achGot:'🏅 ERFOLG', locked:'gesperrt', skinBtn:'🎨 SKINS', skinTitle:'SKINS', active:'AKTIV', choose:'WÄHLEN',
      near:['KNAPP!','lowkey close','W ausweichen','ZACK!','fr fr','skill 🔥','HUI!'],
      combo:{3:'W COMBO',5:'GOATED 🐐',8:'SIGMA 🗿',12:'+1000 AURA',16:'GÖTTLICH fr',20:'NO CAP 🔥',24:'CYBER-GOD'},
      quips:["Dein Pixel-Ich ist jetzt Teil des Bodenbelags.","Tod durch Quadrat. Wie würdevoll.","Die gute Nachricht: Es tat nur einen Frame lang weh.","R.I.P. – Rendered In Pieces.","Selbst das Tutorial weint gerade.","Reflexe wie ein Faultier im Winterschlaf.","Glückwunsch! Du hast den Boden gefunden.","Die Synthwave-Götter schütteln den Kopf.","Du hattest EINE Aufgabe.","Statistisch gesehen: peinlich."],
      insults:["Schwach. Richtig schwach.","Loser-Alarm. 🚨","Meine Oma weicht besser aus.","Git gud, sagt man da.","Setzen. Sechs.","skill issue tbh.","−1000 Aura, digga.","mid. einfach mid.","sit down, bro.","0 rizz, 0 skill.","ratio. L. cope.","NPC-Tod erkannt."],
      dumb:["bro hat einfach... ja.","skibidi 🚽","das ist lowkey mid","real ones wissen Bescheid","kein Cap fr fr","gönn dir, digga","sigma move 🗿","Ohio-Level erreicht","valid. einfach valid.","slay 💅","based ngl","gyatt 😳","6 7 😶‍🌫️","das ribbelt im Hirn"],
      crazy:["weiche aus · sammle · überlebe","probier nicht zu sterben (du wirst)","100% chiptune, 0% gnade","heute schon explodiert?","no cap, das wird mid","6 7 enjoyer welcome"]
    },
    en:{
      tag:'dodge · collect · survive', daily:'🗓 DAILY CHALLENGE', workshop:'WORKSHOP', settings:'⚙️ SETTINGS',
      how:'Mouse or <b>finger</b> · barely dodge = <b>near-miss bonus</b> · grab 🛡 · <b>ESC</b> = menu', install:'📲 Install app',
      ios:'On iPhone: tap the <b>Share</b> icon → <b>"Add to Home Screen"</b> – then NEONDRIFT runs fullscreen.',
      m_normal:'NORMAL', m_normalD:'Levels, new shapes, boss waves, upgrade cards & power-ups. The full ride.',
      m_hard:'HARDCORE', m_hardD:'No orbs. Brutally fast. Only guts, near-misses & power-ups save you.',
      m_zen:'ZEN', m_zenD:'No death. A hit only costs your combo. Chill, collect, chase the highscore.',
      pause:'PAUSE', resume:'▶ RESUME', mainmenu:'☰ MAIN MENU', chooseUp:'CHOOSE UPGRADE', arsenal:'🔫 ARSENAL', level:'Level',
      newWeapon:'NEW WEAPON', path:'PATH', slotsLbl:'Slots', synTitle:'Synergies', noSyn:'— none yet —', drop:'drop', lockedW:'🔒 Workshop', equipHint:'Tap to equip / unequip', loadoutTitle:'🎒 LOADOUT', arsenalTitle:'🎒 ARSENAL', freeSlot:'free', loadoutBtn:'🎒 LOADOUT', arsenalBtn:'🎒 ARSENAL', synUnlocked:'SYNERGY!',
      balance:'Balance', shopHint:'saved permanently · ever pricier & crazier', back:'← BACK', resetAll:'♻ RESET EVERYTHING', reallyQ:'SURE? ✓ (tap)',
      setTitle:'SETTINGS', tapToggle:'Tap to toggle', optShake:'Screenshake', optFx:'Screen effects', optCurses:'🎲 Funny curses', optGuns:'🔫 Shooting / weapons', optLang:'🌐 Language',
      on:'ON', off:'OFF', reduced:'REDUCED', activated:'activated', crash:'CRASH', points:'Score', record:'Best', newRec:'★ NEW RECORD ★', again:'AGAIN', share:'📤 SHARE', menu:'MENU', best:'BEST',
      lvl:'LEVEL', newForm:'New shape: ', faster:'Faster & denser!', bossWave:'⚠ BOSS WAVE ', megaBoss:'🛸 MEGA-BOSS', endgegner:'👾 THE FINAL BOSS', finaleSub:'survive the inferno!',
      survived:'SURVIVED!', defeated:'DEFEATED! 💥', escaped:'🛸 ESCAPED…', escapedSub:'the loot is gone!', armUp:'Gear up for the boss · Level ',
      overdrive:'⚡ OVERDRIVE', overdriveSub:"you're on fire!", enrage:'🔥 ENRAGE!', enrageSub:'it totally loses it!',
      beaten:'🏆 YOU BEAT IT!', beatenSub:'…but it never stops.', madness:'☣ MADNESS MODE', madnessSub:'how far can you go?', clearedTag:'🏆 BEATEN!  ·  ',
      shieldGone:'SHIELD GONE!', comboGoneZ:'COMBO LOST', lifeLost:'−1 ♥', livesLeft:' ♥ LEFT', comboOut:'COMBO OUT', perfect:'PERFECT! 🎯', daily2:'🗓 DAILY',
      pSchild:'SHIELD', pSlow:'SLOW-MO', pMagnet:'MAGNET', pDouble:'SCORE ✕2', pBomb:'BOMB', boom:'BOOM!', boomSub:' vaporized', curseTag:'🎲 CURSE',
      shareScore:' points! Beat me 🔥 ', beatMe:'BEAT ME. 🔥', pointsBig:'POINTS', dailyLbl:'DAILY', modeDaily:'DAILY',
      achBtn:'🏅 ACHIEVEMENTS', achTitle:'ACHIEVEMENTS', achGot:'🏅 ACHIEVEMENT', locked:'locked', skinBtn:'🎨 SKINS', skinTitle:'SKINS', active:'ACTIVE', choose:'SELECT',
      near:['CLOSE!','lowkey close','clean dodge','ZOOM!','fr fr','skill 🔥','WHEW!'],
      combo:{3:'W COMBO',5:'GOATED 🐐',8:'SIGMA 🗿',12:'+1000 AURA',16:'GODLIKE fr',20:'NO CAP 🔥',24:'CYBER-GOD'},
      quips:["Your pixel self is now part of the flooring.","Death by square. How dignified.","Good news: it only hurt for one frame.","R.I.P. – Rendered In Pieces.","Even the tutorial is crying.","Reflexes like a sloth on melatonin.","Congrats! You found the floor.","The synthwave gods shake their heads.","You had ONE job.","Statistically speaking: embarrassing."],
      insults:["Weak. Real weak.","Loser alert. 🚨","My grandma dodges better.","Git gud, they say.","Sit down. Zero.","skill issue tbh.","−1000 aura, bro.","mid. just mid.","sit down, bro.","0 rizz, 0 skill.","ratio. L. cope.","NPC death detected."],
      dumb:["bro just... yeah.","skibidi 🚽","this is lowkey mid","real ones know","no cap fr fr","treat yourself, bro","sigma move 🗿","reached Ohio level","valid. just valid.","slay 💅","based ngl","gyatt 😳","6 7 😶‍🌫️","that's brain-tingling"],
      crazy:["dodge · collect · survive","try not to die (you will)","100% chiptune, 0% mercy","exploded yet today?","no cap, this'll be mid","6 7 enjoyer welcome"]
    },
    fr:{
      tag:'esquive · collecte · survis', daily:'🗓 DÉFI DU JOUR', workshop:'ATELIER', settings:'⚙️ RÉGLAGES',
      how:'Souris ou <b>doigt</b> · frôler = <b>bonus near-miss</b> · choper 🛡 · <b>ESC</b> = menu', install:'📲 Installer l’appli',
      ios:'Sur iPhone : touche l’icône <b>Partager</b> → <b>« Sur l’écran d’accueil »</b> – NEONDRIFT passe en plein écran.',
      m_normal:'NORMAL', m_normalD:'Niveaux, nouvelles formes, vagues de boss, cartes d’amélioration & power-ups. Le pack complet.',
      m_hard:'HARDCORE', m_hardD:'Pas d’orbes. Ultra rapide. Seuls le cran, les near-miss & power-ups te sauvent.',
      m_zen:'ZEN', m_zenD:'Pas de mort. Un coup coûte juste ton combo. Chill, collecte, vise le highscore.',
      pause:'PAUSE', resume:'▶ REPRENDRE', mainmenu:'☰ MENU', chooseUp:'CHOISIS UNE AMÉLIORATION', arsenal:'🔫 ARSENAL', level:'Niveau',
      newWeapon:'NOUVELLE ARME', path:'VOIE', slotsLbl:'Slots', synTitle:'Synergies', noSyn:'— aucune —', drop:'retirer', lockedW:'🔒 Atelier', equipHint:'Touchez pour équiper/retirer', loadoutTitle:'🎒 LOADOUT', arsenalTitle:'🎒 ARSENAL', freeSlot:'libre', loadoutBtn:'🎒 LOADOUT', arsenalBtn:'🎒 ARSENAL', synUnlocked:'SYNERGIE !',
      balance:'Solde', shopHint:'sauvegardé · toujours plus cher & plus fou', back:'← RETOUR', resetAll:'♻ TOUT RÉINITIALISER', reallyQ:'SÛR ? ✓ (touche)',
      setTitle:'RÉGLAGES', tapToggle:'Touche pour changer', optShake:'Tremblement', optFx:'Effets d’écran', optCurses:'🎲 Malédictions fun', optGuns:'🔫 Tir / armes', optLang:'🌐 Langue',
      on:'OUI', off:'NON', reduced:'RÉDUIT', activated:'activé', crash:'CRASH', points:'Score', record:'Record', newRec:'★ NOUVEAU RECORD ★', again:'REJOUER', share:'📤 PARTAGER', menu:'MENU', best:'BEST',
      lvl:'NIVEAU', newForm:'Nouvelle forme : ', faster:'Plus vite & plus dense !', bossWave:'⚠ VAGUE DE BOSS ', megaBoss:'🛸 MÉGA-BOSS', endgegner:'👾 LE BOSS FINAL', finaleSub:'survis à l’enfer !',
      survived:'SURVÉCU !', defeated:'VAINCU ! 💥', escaped:'🛸 ENFUI…', escapedSub:'le butin s’envole !', armUp:'Équipe-toi pour le boss · Niveau ',
      overdrive:'⚡ OVERDRIVE', overdriveSub:'tu es en feu !', enrage:'🔥 ENRAGE !', enrageSub:'il pète un câble !',
      beaten:'🏆 TERMINÉ !', beatenSub:'…mais ça ne s’arrête pas.', madness:'☣ MODE FOLIE', madnessSub:'jusqu’où iras-tu ?', clearedTag:'🏆 TERMINÉ !  ·  ',
      shieldGone:'BOUCLIER PERDU !', comboGoneZ:'COMBO PERDU', lifeLost:'−1 ♥', livesLeft:' ♥ RESTANT', comboOut:'COMBO FINI', perfect:'PARFAIT ! 🎯', daily2:'🗓 DAILY',
      pSchild:'BOUCLIER', pSlow:'RALENTI', pMagnet:'AIMANT', pDouble:'SCORE ✕2', pBomb:'BOMBE', boom:'BOUM !', boomSub:' pulvérisés', curseTag:'🎲 MALÉDICTION',
      shareScore:' points ! Bats-moi 🔥 ', beatMe:'BATS-MOI. 🔥', pointsBig:'POINTS', dailyLbl:'DAILY', modeDaily:'DAILY',
      achBtn:'🏅 SUCCÈS', achTitle:'SUCCÈS', achGot:'🏅 SUCCÈS', locked:'verrouillé', skinBtn:'🎨 SKINS', skinTitle:'SKINS', active:'ACTIF', choose:'CHOISIR',
      near:['JUSTE !','presque touché','esquive propre','ZOU !','fr fr','skill 🔥','OUF !'],
      combo:{3:'W COMBO',5:'GOATED 🐐',8:'SIGMA 🗿',12:'+1000 AURA',16:'DIVIN fr',20:'NO CAP 🔥',24:'CYBER-DIEU'},
      quips:["Ton toi en pixels fait maintenant partie du sol.","Mort par carré. Quelle dignité.","Bonne nouvelle : ça n’a fait mal qu’une frame.","R.I.P. – Rendu En Pièces.","Même le tutoriel pleure.","Des réflexes de paresseux sous mélatonine.","Bravo ! Tu as trouvé le sol.","Les dieux de la synthwave secouent la tête.","Tu avais UNE mission.","Statistiquement : gênant."],
      insults:["Faible. Vraiment faible.","Alerte loser. 🚨","Ma mamie esquive mieux.","Git gud, qu’ils disent.","Assieds-toi. Zéro.","skill issue tbh.","−1000 d’aura, mec.","mid. juste mid.","assieds-toi, frère.","0 rizz, 0 skill.","ratio. L. cope.","mort de PNJ détectée."],
      dumb:["le frère a juste… ouais.","skibidi 🚽","c’est lowkey mid","les vrais savent","no cap fr fr","fais-toi plaisir, mec","sigma move 🗿","niveau Ohio atteint","valide. juste valide.","slay 💅","based ngl","gyatt 😳","6 7 😶‍🌫️","ça gratte le cerveau"],
      crazy:["esquive · collecte · survis","essaie de pas mourir (tu vas mourir)","100% chiptune, 0% pitié","déjà explosé aujourd’hui ?","no cap, ça va être mid","6 7 enjoyer welcome"]
    }
  };
  // Upgrade-Karten- & Werkstatt-Übersetzungen [Name, Beschreibung]
  const UPTR={
    de:{radar:['Radar','Near-Miss-Radius +45%'],shieldgen:['Schildgenerator','+1 Schild & +1 pro Boss'],glass:['Glaskanone','+30% Punkte, +15% Hitbox'],nimble:['Flink','Reaktion schneller'],small:['Kompakt','Hitbox −18%'],orbval:['Orb-Veredelung','Orbs +60% Punkte'],magnet:['Magnetfeld','Dauerhafter Orb-Sog'],loot:['Glücksbringer','Power-Ups +50% öfter'],combo:['Combo-Anker','+1 Combo je Near-Miss'],reflex:['Reflex-Kern','Slow-Mo +50% länger'],heart:['Extra-Herz','+1 Leben'],banana:['Bananen-Boden','Steuerung rutschig, +65% Punkte'],smol:['Smol Brain','Hitbox +28%, +2 Schild'],energy:['Energy-Drink-OD','Gegner +22% schnell, Radar +75%'],blind:['Drip aber blind','Sicht eng, +90% Punkte'],clown:['Clown-Modus','+30% Gedränge, Orbs ×2'],mirror:['Spiegelwelt','Steuerung gespiegelt, +55% Punkte'],blaster:['Blaster','Auto-Feuer · +Feuerrate'],twin:['Doppellauf','+1 Bolzen · je Bolzen schwächer'],power:['Schadenskern','+1 Schaden'],pierce:['Durchschlag','Bolzen durchschlägt +1'],missile:['Lenkraketen','Zielsuchend · Explosion (AoE)'],flame:['Brandbolzen','Entzündet Ziele (Brennschaden)'],frost:['Frostschuss','Vereist & verlangsamt Ziele'],chain:['Kettenblitz','Kill springt auf nahe Ziele'],amp:['Verstärker','+18% Schaden für ALLE Waffen'],tempo:['Taktung','ALLE Waffen feuern 12% schneller']},
    en:{radar:['Radar','Near-miss radius +45%'],shieldgen:['Shield Gen','+1 shield & +1 per boss'],glass:['Glass Cannon','+30% score, +15% hitbox'],nimble:['Nimble','Faster reaction'],small:['Compact','Hitbox −18%'],orbval:['Orb Refining','Orbs +60% score'],magnet:['Magnet Field','Permanent orb pull'],loot:['Lucky Charm','Power-ups +50% more often'],combo:['Combo Anchor','+1 combo per near-miss'],reflex:['Reflex Core','Slow-mo +50% longer'],heart:['Extra Heart','+1 life'],banana:['Banana Floor','Slippery steering, +65% score'],smol:['Smol Brain','Hitbox +28%, +2 shield'],energy:['Energy-Drink OD','Enemies +22% fast, radar +75%'],blind:['Drip but Blind','Limited view, +90% score'],clown:['Clown Mode','+30% crowd, orbs ×2'],mirror:['Mirror World','Steering flipped, +55% score'],blaster:['Blaster','Auto-fire · +fire rate'],twin:['Twin Barrel','+1 bolt · each bolt weaker'],power:['Damage Core','+1 damage'],pierce:['Piercing','Bolt pierces +1'],missile:['Homing Missiles','Seeking · explosion (AoE)'],flame:['Flame Bolts','Ignites targets (burn damage)'],frost:['Frost Shot','Freezes & slows targets'],chain:['Chain Lightning','Kills arc to nearby targets'],amp:['Amplifier','+18% damage for ALL weapons'],tempo:['Cadence','ALL weapons fire 12% faster']},
    fr:{radar:['Radar','Rayon near-miss +45%'],shieldgen:['Générateur','+1 bouclier & +1 par boss'],glass:['Canon de Verre','+30% score, +15% hitbox'],nimble:['Agile','Réaction plus vive'],small:['Compact','Hitbox −18%'],orbval:['Raffinage d’Orbe','Orbes +60% score'],magnet:['Champ Magnétique','Attraction permanente'],loot:['Porte-Bonheur','Power-ups +50% plus souvent'],combo:['Ancre Combo','+1 combo par near-miss'],reflex:['Noyau Réflexe','Ralenti +50% plus long'],heart:['Cœur Bonus','+1 vie'],banana:['Sol Banane','Pilotage glissant, +65% score'],smol:['Smol Brain','Hitbox +28%, +2 bouclier'],energy:['Energy-Drink OD','Ennemis +22% vite, radar +75%'],blind:['Drip mais Aveugle','Vue réduite, +90% score'],clown:['Mode Clown','+30% foule, orbes ×2'],mirror:['Monde Miroir','Pilotage inversé, +55% score'],blaster:['Blaster','Tir auto · +cadence'],twin:['Double Canon','+1 projectile · chacun plus faible'],power:['Noyau de Dégâts','+1 dégât'],pierce:['Perforant','Le tir traverse +1'],missile:['Missiles Guidés','À tête chercheuse · explosion (AoE)'],flame:['Tirs Incendiaires','Enflamme les cibles (brûlure)'],frost:['Tir de Givre','Gèle et ralentit les cibles'],chain:['Éclair en Chaîne','Le kill rebondit sur les cibles'],amp:['Amplificateur','+18% dégâts pour TOUTES les armes'],tempo:['Cadence','TOUTES les armes tirent 12% plus vite']}
  };
  // Waffen (Basis), Skill-Pfade & Synergien – [Name, Beschreibung]
  const WTR={
    de:{blaster:['Blaster','Auto-Bolzen nach oben'],missile:['Lenkraketen','Zielsuchend · Explosion (AoE)'],flame:['Brandbolzen','Entzündet Ziele (Brennschaden)'],frost:['Frostschuss','Vereist & verlangsamt Ziele'],chain:['Kettenblitz','Zappt das nächste Ziel · Kette']},
    en:{blaster:['Blaster','Auto-bolts upward'],missile:['Homing Missiles','Seeking · explosion (AoE)'],flame:['Flame Bolts','Ignites targets (burn)'],frost:['Frost Shot','Freezes & slows'],chain:['Chain Lightning','Zaps nearest target · chains']},
    fr:{blaster:['Blaster','Tirs auto vers le haut'],missile:['Missiles Guidés','À tête chercheuse · explosion'],flame:['Tirs Incendiaires','Enflamme (brûlure)'],frost:['Tir de Givre','Gèle et ralentit'],chain:['Éclair en Chaîne','Frappe la cible la plus proche · chaîne']}
  };
  const PTR={
    de:{rapid:['Schnellfeuer','+50% Feuerrate, etwas weniger Schaden'],heavy:['Wuchtschuss','Langsamer, aber doppelter Schaden'],scatter:['Streuschuss','+2 Bolzen (Fächer), je schwächer'],precise:['Präzision','+2 Durchschlag, +40% Schaden'],swarm:['Schwarm','2 kleinere Raketen'],warhead:['Sprengkopf','1 große Rakete, +50% Radius'],shrapnel:['Splittergranate','Explosion schleudert Splitter'],incendiary:['Brandsatz','Explosion entzündet Ziele'],ember:['Glut','Fast doppelter Brennschaden'],wildfire:['Flächenbrand','Feuer springt beim Tod über'],accel:['Brandbeschleuniger','Brennt schneller (kürzer, härter)'],consume:['Verzehr','Brand-Kills geben Bonuspunkte'],permafrost:['Permafrost','Längere & stärkere Verlangsamung'],glaciate:['Vereisung','Chance, Ziele komplett einzufrieren'],shatter:['Splitterbruch','Gefrorene Ziele zerspringen (AoE)'],brittle:['Spröde','Gefrorene Ziele nehmen +50% Schaden'],fork:['Überschlag','+2 Sprünge, weniger Schaden je Sprung'],highv:['Hochspannung','Weniger Sprünge, viel Schaden + Stun'],stormhit:['Gewitter','Kette auch bei Bolzen-Kills'],dischargeaoe:['Entladung','Jeder Kettentreffer mit kleinem AoE']},
    en:{rapid:['Rapid Fire','+50% fire rate, a bit less damage'],heavy:['Heavy Shot','Slower, but double damage'],scatter:['Scatter','+2 bolts (fan), each weaker'],precise:['Precision','+2 pierce, +40% damage'],swarm:['Swarm','2 smaller missiles'],warhead:['Warhead','1 big missile, +50% radius'],shrapnel:['Shrapnel','Explosion flings shards'],incendiary:['Incendiary','Explosion ignites targets'],ember:['Ember','Almost double burn damage'],wildfire:['Wildfire','Fire spreads on death'],accel:['Accelerant','Burns faster (shorter, harder)'],consume:['Consume','Burn-kills grant bonus points'],permafrost:['Permafrost','Longer & stronger slow'],glaciate:['Glaciate','Chance to fully freeze targets'],shatter:['Shatter','Frozen targets burst (AoE)'],brittle:['Brittle','Frozen targets take +50% damage'],fork:['Forking','+2 jumps, less damage each'],highv:['High Voltage','Fewer jumps, big damage + stun'],stormhit:['Storm','Chains also on bolt-kills'],dischargeaoe:['Discharge','Each chain hit with small AoE']},
    fr:{rapid:['Tir Rapide','+50% cadence, un peu moins de dégâts'],heavy:['Tir Lourd','Plus lent, mais double dégâts'],scatter:['Dispersion','+2 projectiles (éventail), plus faibles'],precise:['Précision','+2 perforation, +40% dégâts'],swarm:['Essaim','2 missiles plus petits'],warhead:['Ogive','1 gros missile, +50% rayon'],shrapnel:['Éclats','L’explosion projette des éclats'],incendiary:['Incendiaire','L’explosion enflamme les cibles'],ember:['Braise','Brûlure presque doublée'],wildfire:['Embrasement','Le feu se propage à la mort'],accel:['Accélérant','Brûle plus vite (court, fort)'],consume:['Consumer','Les kills par feu donnent des points'],permafrost:['Permafrost','Ralenti plus long & plus fort'],glaciate:['Glaciation','Chance de geler totalement'],shatter:['Éclatement','Les cibles gelées éclatent (AoE)'],brittle:['Fragile','Les cibles gelées subissent +50%'],fork:['Ramification','+2 sauts, moins de dégâts'],highv:['Haute Tension','Moins de sauts, gros dégâts + stun'],stormhit:['Orage','Chaîne aussi sur les kills de tir'],dischargeaoe:['Décharge','Chaque saut avec petit AoE']}
  };
  const SYNTR={
    de:{thermo:['Thermoschock','Brennende + gefrorene Ziele nehmen massiven Schaden'],super:['Supraleiter','Kette +1 Sprung & +50% an Gefrorenen'],napalm:['Napalm','Raketen hinterlassen Brand im Explosionsradius'],tesla:['Tesla-Salve','Jeder 5. Blaster-Bolzen verzweigt als Blitz'],icebomb:['Eisbombe','Raketen-Explosion vereist Ziele']},
    en:{thermo:['Thermal Shock','Burning + frozen targets take massive damage'],super:['Superconductor','Chain +1 jump & +50% vs frozen'],napalm:['Napalm','Missiles leave fire in the blast radius'],tesla:['Tesla Volley','Every 5th blaster bolt arcs as lightning'],icebomb:['Ice Bomb','Missile blasts freeze targets']},
    fr:{thermo:['Choc Thermique','Cibles en feu + gelées subissent d’énormes dégâts'],super:['Supraconducteur','Chaîne +1 saut & +50% vs gelés'],napalm:['Napalm','Les missiles laissent du feu dans le rayon'],tesla:['Salve Tesla','Chaque 5e tir du blaster se ramifie'],icebomb:['Bombe de Glace','Les explosions de missiles gèlent']}
  };
  const wName=id=>((WTR[lang]&&WTR[lang][id])||WTR.en[id]||[id])[0];
  const wDesc=id=>(((WTR[lang]&&WTR[lang][id])||WTR.en[id]||['',''])[1])||'';
  const pName=id=>((PTR[lang]&&PTR[lang][id])||PTR.en[id]||[id])[0];
  const pDesc=id=>(((PTR[lang]&&PTR[lang][id])||PTR.en[id]||['',''])[1])||'';
  const synName=id=>((SYNTR[lang]&&SYNTR[lang][id])||SYNTR.en[id]||[id])[0];
  const synDesc=id=>(((SYNTR[lang]&&SYNTR[lang][id])||SYNTR.en[id]||['',''])[1])||'';
  const METATR={
    de:{slot:['Modul-Slot','+1 Waffen-Slot (max 5)'],bp_missile:['Bauplan: Raketen','Schaltet Lenkraketen fürs Loadout frei'],bp_flame:['Bauplan: Brand','Schaltet Brandbolzen fürs Loadout frei'],bp_frost:['Bauplan: Frost','Schaltet Frostschuss fürs Loadout frei'],bp_chain:['Bauplan: Kette','Schaltet Kettenblitz fürs Loadout frei'],shield:['Startschild','+1 Schild zu Beginn je Stufe'],tough:['Zähigkeit','+1 Leben zu Beginn je Stufe'],solid:['Solide Hülle','Start-Hitbox −5% je Stufe'],reach:['Fern-Sensor','Near-Miss-Radius +9% je Stufe'],score:['Punkte-Boost','+15% Punkte je Stufe'],luck:['Glückssträhne','Power-Ups +10% je Stufe'],rich:['Chip-Magnet','+12% Chip-Ausbeute je Stufe']},
    en:{slot:['Module Slot','+1 weapon slot (max 5)'],bp_missile:['Blueprint: Missiles','Unlocks homing missiles for loadout'],bp_flame:['Blueprint: Flame','Unlocks flame bolts for loadout'],bp_frost:['Blueprint: Frost','Unlocks frost shot for loadout'],bp_chain:['Blueprint: Chain','Unlocks chain lightning for loadout'],shield:['Start Shield','+1 shield at start per lvl'],tough:['Toughness','+1 life at start per lvl'],solid:['Solid Hull','Start hitbox −5% per lvl'],reach:['Far Sensor','Near-miss radius +9% per lvl'],score:['Score Boost','+15% score per lvl'],luck:['Lucky Streak','Power-ups +10% per lvl'],rich:['Chip Magnet','+12% chip yield per lvl']},
    fr:{slot:['Slot de Module','+1 slot d’arme (max 5)'],bp_missile:['Plan: Missiles','Débloque les missiles pour le loadout'],bp_flame:['Plan: Feu','Débloque les tirs incendiaires'],bp_frost:['Plan: Givre','Débloque le tir de givre'],bp_chain:['Plan: Chaîne','Débloque l’éclair en chaîne'],shield:['Bouclier de Départ','+1 bouclier au départ/niv'],tough:['Robustesse','+1 vie au départ/niv'],solid:['Coque Solide','Hitbox de départ −5%/niv'],reach:['Capteur Lointain','Rayon near-miss +9%/niv'],score:['Boost de Score','+15% score/niv'],luck:['Veine','Power-ups +10%/niv'],rich:['Aimant à Chips','+12% de chips/niv']}
  };
  const uName=id=>((UPTR[lang]&&UPTR[lang][id])||UPTR.en[id]||UPTR.de[id]||[id])[0];
  const uDesc=id=>(((UPTR[lang]&&UPTR[lang][id])||UPTR.en[id]||UPTR.de[id]||['',''])[1])||'';
  const mName=id=>((METATR[lang]&&METATR[lang][id])||METATR.en[id]||METATR.de[id]||[id])[0];
  const mTxt =id=>(((METATR[lang]&&METATR[lang][id])||METATR.en[id]||METATR.de[id]||['',''])[1])||'';
  const FORMTR={de:{sine:'Wellenflug',drift:'Gleiter',orbit:'Kreisel',zigzag:'Irrläufer',pendulum:'Pendler'},
    en:{sine:'Wave Flight',drift:'Glider',orbit:'Orbiter',zigzag:'Zigzagger',pendulum:'Pendulum'},
    fr:{sine:'Vol Ondulé',drift:'Planeur',orbit:'Orbiteur',zigzag:'Zigzagueur',pendulum:'Pendule'}};
  const formName=k=>((FORMTR[lang]&&FORMTR[lang][k])||FORMTR.en[k]||k);
  const modeLabel=m=>t('m_'+(m==='hardcore'?'hard':m));

  let player, obstacles, orbs, powerups, particles, floaters, lasers, stars, bullets, gems;
  let tBlast=0, tMiss=0, tFlame=0, tFrost=0, tChain=0, teslaCount=0, bossPending=false, boss=null, ebullets=[], gemT=0;
  let score, displayScore, combo, multiplier, best=loadScores();
  function loadScores(){ try{ const r=JSON.parse(localStorage.getItem('neondrift_best')); if(r&&typeof r==='object') return {normal:r.normal||0,hardcore:r.hardcore||0,zen:r.zen||0,daily:r.daily||0,dailyDate:r.dailyDate||''}; }catch(e){} return {normal:0,hardcore:0,zen:0,daily:0,dailyDate:''}; }
  function saveScores(){ try{ localStorage.setItem('neondrift_best',JSON.stringify(best)); }catch(e){} }
  // Meta-Progression: persistente Chips + dauerhafte Upgrade-Stufen
  let meta=loadMeta();
  function loadMeta(){ try{ const r=JSON.parse(localStorage.getItem('neondrift_meta')); if(r&&typeof r==='object') return {chips:r.chips||0,lvl:r.lvl||{},won:r.won||0,shopDate:r.shopDate||'',ach:r.ach||{},stats:r.stats||{},skins:r.skins||{},skin:r.skin||'std',loadout:Array.isArray(r.loadout)?r.loadout:['blaster']}; }catch(e){} return {chips:0,lvl:{},won:0,shopDate:'',ach:{},stats:{},skins:{},skin:'std',loadout:['blaster']}; }
  function saveMeta(){ try{ localStorage.setItem('neondrift_meta',JSON.stringify(meta)); }catch(e){} }
  const fmt=n=>{ n=Math.round(n||0); return n>=10000?(n/1000).toFixed(n>=100000?0:1)+'k':''+n; };
  function statN(k){ return (meta.stats&&meta.stats[k])||0; }
  function addStat(k,n){ meta.stats=meta.stats||{}; meta.stats[k]=(meta.stats[k]||0)+n; }
  // Werkstatt-Upgrades: Kosten = Basis × Stufe^1.8 (zwischen linear & exponentiell) & immer krasser
  const META=[
    {id:'slot',        ico:'🧩',name:'Modul-Slot',   base:600,max:2},
    {id:'bp_missile',  ico:'🚀',name:'Bauplan: Raketen',base:260,max:1},
    {id:'bp_flame',    ico:'🔥',name:'Bauplan: Brand',base:220,max:1},
    {id:'bp_frost',    ico:'❄️',name:'Bauplan: Frost',base:220,max:1},
    {id:'bp_chain',    ico:'⛓️',name:'Bauplan: Kette',base:300,max:1},
    {id:'shield',      ico:'🛡️',name:'Startschild',  base:110,max:3},
    {id:'tough',       ico:'💗',name:'Zähigkeit',    base:420,max:2},
    {id:'solid',       ico:'🔻',name:'Solide Hülle', base:80, max:4},
    {id:'reach',       ico:'📡',name:'Fern-Sensor',  base:70, max:4},
    {id:'score',       ico:'💎',name:'Punkte-Boost', base:130,max:4},
    {id:'luck',        ico:'🎁',name:'Glückssträhne',base:100,max:3},
    {id:'rich',        ico:'◈', name:'Chip-Magnet',  base:60, max:6}
  ];
  const metaCost=(m,lvl)=>Math.round(m.base*Math.pow(lvl+1,1.8)/10)*10;
  const metaLvl=id=>(meta.lvl&&meta.lvl[id])||0;
  function chipMult(){ return 1+0.12*metaLvl('rich'); }
  // Werkstatt täglich zurücksetzen (Schalter); Trophäen bleiben immer
  function dailyShopCheck(){ if(opt.dailyShop && meta.shopDate!==dailyLabel()){ meta.chips=0; meta.lvl={}; meta.shopDate=dailyLabel(); saveMeta(); } }
  const weaponUnlocked=id=> id==='blaster' || metaLvl('bp_'+id)>0;
  function applyMeta(){
    arsenal.slots=3+metaLvl('slot');                       // Werkstatt: Modul-Slots (max +2 → 5)
    // Pre-Run-Loadout: vorab gewählte Startwaffen (nur freigeschaltete Baupläne), auf Slots begrenzt
    arsenal.w={};
    if(opt.guns){ let lo=(meta.loadout&&meta.loadout.length)?meta.loadout.slice():['blaster'];
      for(const id of lo){ if(WID[id]&&weaponUnlocked(id)&&!arsenal.w[id]&&ownedCount()<arsenal.slots) arsenal.w[id]={lvl:1,f1:null,f2:null}; } }
    const sh=metaLvl('shield'); if(sh) shields=Math.min(shields+sh,6);
    const to=metaLvl('tough'); if(to) lives=Math.min(lives+to,6);
    const so=metaLvl('solid'); if(so){ mods.playerR*=Math.pow(0.95,so); player.r=mods.playerR; }
    const re=metaLvl('reach'); if(re) mods.nearRadius*=(1+0.09*re);
    const scn=metaLvl('score'); if(scn) mods.scoreMult*=(1+0.15*scn);
    const lu=metaLvl('luck'); if(lu) mods.powerupRate*=(1+0.10*lu);
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
  let elapsed, spawnT, orbT, powerupT, difficulty, shake, flash, flashColor, nearGlow, nearCount;
  let level, levelTimer, levelDuration, unlocked, nextUpgradeAt, upStep;
  let bossActive, bossTimer, bossPhaseT, bossNumber, laserSpawnT;
  let banner, effects, shields, invuln, mods, upgradeCounts, lives, commentT, egg67done, egg67T;
  let comboTime=0, comboTimeMax=3.4;                 // Combo-Decay-Timer
  let beatIdx=0, beatPulse=0, spawnQueued=false, orbQueued=false; // Beat-Sync
  let daily=false;                                    // Daily-Challenge aktiv?
  let director=0.5, overdrive=false;                  // DDA + Combo-Overdrive
  let endless=false, madness=0, wonThisRun=false, laserFinal=false; // Finale + Wahnsinn-Modus
  let runOrbs=0, runPerfect=0, runBosses=0, madnessTime=0, runMaxMult=1;  // Statistik pro Run
  let shipSeed=1;                                      // Stil-Seed des Spieler-Raumschiffs
  let shipSprite=null, shipSig='';                     // gebackener Pixel-Sprite + Signatur
  let opt=loadOpt();                                  // Einstellungen (Screenshake/Effekte/Flüche)
  function loadOpt(){ try{ const r=JSON.parse(localStorage.getItem('neondrift_opt')); if(r&&typeof r==='object') return {shake:r.shake==null?1:r.shake,fx:r.fx==null?1:r.fx,curses:r.curses==null?true:r.curses,guns:r.guns==null?true:r.guns,dailyShop:r.dailyShop==null?true:r.dailyShop}; }catch(e){} return {shake:1,fx:1,curses:true,guns:true,dailyShop:true}; }
  function saveOpt(){ try{ localStorage.setItem('neondrift_opt',JSON.stringify(opt)); }catch(e){} }

  // ---------- Audio ----------
  let actx=null, muted=false, masterGain=null, musicGain=null;
  function ensureCtx(){
    if(actx) return true;
    try{ actx=new (window.AudioContext||window.webkitAudioContext)();
      masterGain=actx.createGain(); masterGain.gain.value=0.9; masterGain.connect(actx.destination);
      musicGain=actx.createGain(); musicGain.gain.value=0.42; musicGain.connect(masterGain);
      return true;
    }catch(e){ actx=null; return false; }
  }
  function unlockAudio(){
    if(!ensureCtx()) return;
    try{ if(actx.state==='suspended') actx.resume();
      const b=actx.createBuffer(1,1,22050), s=actx.createBufferSource(); s.buffer=b; s.connect(actx.destination); s.start(0);
    }catch(e){}
    if(!muted) startMusic();
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
  const sfxOrb=c=>beep(440+Math.min(c,20)*40,0.12,'triangle',0.32);
  const sfxNear=()=>beep(900,0.07,'sine',0.18,400);
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
  function sfxWin(){beep(523,0.12,'triangle',0.4);setTimeout(()=>beep(784,0.18,'triangle',0.4),110);}
  const sfxWarn=()=>beep(760,0.05,'square',0.12);
  const sfxFire=()=>beep(120,0.35,'sawtooth',0.4,-50);
  const sfxPow=()=>{beep(660,0.08,'square',0.3);setTimeout(()=>beep(990,0.12,'square',0.3),70);};
  const sfxLevel=()=>{beep(523,0.08,'square',0.3);setTimeout(()=>beep(659,0.08,'square',0.3),80);setTimeout(()=>beep(880,0.14,'square',0.3),160);};
  const sfxShieldBreak=()=>beep(300,0.25,'sawtooth',0.35,-150);
  const sfxUpgrade=()=>{beep(440,0.1,'triangle',0.3);setTimeout(()=>beep(660,0.1,'triangle',0.3),90);setTimeout(()=>beep(880,0.16,'triangle',0.35),180);};
  let shootTick=0;
  function sfxShoot(){ shootTick^=1; beep(shootTick?900:980,0.035,'square',0.07,260); } // leiser, hoher Neon-Pew
  function sfxKill(){ beep(360,0.12,'square',0.22,-180); beep(140,0.18,'sawtooth',0.18,-60); } // Pixel-Boom

  // ---------- Chiptune-Engine (Original-Komposition, loopt in Variationen) ----------
  const BPM=142;
  let musicOn=false, schedTimer=null, step16=0, nextStepTime=0, loopCount=0, secPerStep=60/(BPM*4);
  const midiF=n=>440*Math.pow(2,(n-69)/12);
  // Lead A (C-Dur, heroisch)
  const LEAD1=[
    {s:0,n:72,d:2},{s:2,n:76,d:2},{s:4,n:79,d:3},{s:7,n:77,d:1},{s:8,n:76,d:2},{s:10,n:72,d:2},{s:12,n:74,d:4},
    {s:16,n:74,d:2},{s:18,n:77,d:2},{s:20,n:81,d:3},{s:23,n:79,d:1},{s:24,n:77,d:2},{s:26,n:76,d:2},{s:28,n:72,d:4},
    {s:32,n:72,d:2},{s:34,n:76,d:2},{s:36,n:79,d:2},{s:38,n:84,d:2},{s:40,n:83,d:2},{s:42,n:79,d:2},{s:44,n:76,d:4},
    {s:48,n:74,d:1},{s:49,n:76,d:1},{s:50,n:77,d:2},{s:52,n:79,d:4},{s:56,n:71,d:2},{s:58,n:74,d:2},{s:60,n:72,d:4}
  ];
  const LEAD2=[
    {s:0,n:76,d:1},{s:1,n:79,d:1},{s:2,n:84,d:2},{s:4,n:83,d:2},{s:6,n:79,d:2},{s:8,n:81,d:4},{s:13,n:79,d:1},{s:14,n:77,d:2},
    {s:16,n:77,d:2},{s:18,n:74,d:2},{s:20,n:72,d:2},{s:22,n:74,d:2},{s:24,n:76,d:4},{s:28,n:72,d:4},
    {s:32,n:72,d:2},{s:34,n:79,d:2},{s:36,n:84,d:2},{s:38,n:88,d:2},{s:40,n:86,d:4},{s:44,n:83,d:4},
    {s:48,n:81,d:2},{s:50,n:79,d:2},{s:52,n:77,d:2},{s:54,n:76,d:2},{s:56,n:74,d:2},{s:58,n:72,d:6}
  ];
  // Lead B – NACHTFAHRT (d-Moll, tief, gezogen/dunkel)
  const LEADB1=[
    {s:0,n:62,d:4},{s:4,n:65,d:2},{s:6,n:64,d:2},{s:8,n:62,d:4},{s:12,n:60,d:4},
    {s:16,n:58,d:4},{s:20,n:62,d:2},{s:22,n:65,d:2},{s:24,n:69,d:4},{s:28,n:67,d:4},
    {s:32,n:65,d:2},{s:34,n:67,d:2},{s:36,n:69,d:2},{s:38,n:70,d:2},{s:40,n:69,d:4},{s:44,n:65,d:4},
    {s:48,n:62,d:2},{s:50,n:65,d:2},{s:52,n:69,d:2},{s:54,n:74,d:2},{s:56,n:72,d:4},{s:60,n:69,d:4}
  ];
  const LEADB2=[
    {s:0,n:69,d:2},{s:2,n:70,d:2},{s:4,n:69,d:2},{s:6,n:67,d:2},{s:8,n:65,d:4},{s:12,n:62,d:4},
    {s:16,n:65,d:2},{s:18,n:69,d:2},{s:20,n:74,d:4},{s:24,n:72,d:2},{s:26,n:70,d:2},{s:28,n:69,d:4},
    {s:32,n:74,d:2},{s:34,n:72,d:2},{s:36,n:70,d:2},{s:38,n:69,d:2},{s:40,n:67,d:2},{s:42,n:65,d:2},{s:44,n:62,d:4},
    {s:48,n:64,d:2},{s:50,n:65,d:2},{s:52,n:67,d:2},{s:54,n:69,d:2},{s:56,n:62,d:6}
  ];
  // Lead C – ÜBERTAKTET (A-Dur, hoch, hektisch 16tel)
  const LEADC1=[
    {s:0,n:81,d:1},{s:1,n:78,d:1},{s:2,n:76,d:1},{s:3,n:73,d:1},{s:4,n:76,d:1},{s:5,n:78,d:1},{s:6,n:81,d:2},{s:8,n:83,d:1},{s:9,n:81,d:1},{s:10,n:78,d:2},{s:12,n:76,d:2},{s:14,n:73,d:2},
    {s:16,n:71,d:1},{s:17,n:73,d:1},{s:18,n:76,d:1},{s:19,n:78,d:1},{s:20,n:81,d:2},{s:22,n:78,d:2},{s:24,n:76,d:1},{s:25,n:73,d:1},{s:26,n:71,d:2},{s:28,n:69,d:4},
    {s:32,n:76,d:1},{s:33,n:78,d:1},{s:34,n:81,d:1},{s:35,n:83,d:1},{s:36,n:85,d:2},{s:38,n:83,d:2},{s:40,n:81,d:1},{s:41,n:78,d:1},{s:42,n:76,d:2},{s:44,n:73,d:4},
    {s:48,n:81,d:1},{s:49,n:83,d:1},{s:50,n:81,d:1},{s:51,n:78,d:1},{s:52,n:76,d:2},{s:54,n:73,d:2},{s:56,n:69,d:1},{s:57,n:73,d:1},{s:58,n:76,d:2},{s:60,n:81,d:4}
  ];
  const LEADC2=[
    {s:0,n:76,d:1},{s:1,n:78,d:1},{s:2,n:81,d:2},{s:4,n:78,d:1},{s:5,n:76,d:1},{s:6,n:73,d:2},{s:8,n:76,d:1},{s:9,n:78,d:1},{s:10,n:81,d:1},{s:11,n:83,d:1},{s:12,n:85,d:4},
    {s:16,n:83,d:1},{s:17,n:81,d:1},{s:18,n:78,d:2},{s:20,n:76,d:1},{s:21,n:78,d:1},{s:22,n:81,d:2},{s:24,n:78,d:2},{s:26,n:76,d:2},{s:28,n:73,d:4},
    {s:32,n:81,d:1},{s:33,n:83,d:1},{s:34,n:85,d:2},{s:36,n:88,d:2},{s:38,n:85,d:2},{s:40,n:83,d:1},{s:41,n:81,d:1},{s:42,n:78,d:2},{s:44,n:76,d:4},
    {s:48,n:73,d:1},{s:49,n:76,d:1},{s:50,n:78,d:1},{s:51,n:81,d:1},{s:52,n:83,d:2},{s:54,n:81,d:2},{s:56,n:76,d:4},{s:60,n:69,d:4}
  ];
  const SONGS=[
    {name:'PROLOG',     lead1:LEAD1,  lead2:LEAD2,  bass:[36,45,41,43], chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]], lt:'square',   leadVol:0.16, bassEighths:false, fourFloor:false, hatEvery:2},
    {name:'NACHTFAHRT', lead1:LEADB1, lead2:LEADB2, bass:[38,34,36,33], chords:[[62,65,69],[58,62,65],[60,64,67],[57,60,64]], lt:'sawtooth', leadVol:0.11, bassEighths:true,  fourFloor:false, hatEvery:4},
    {name:'ÜBERTAKTET', lead1:LEADC1, lead2:LEADC2, bass:[45,40,42,38], chords:[[57,61,64],[52,56,59],[54,57,61],[50,54,57]], lt:'square',   leadVol:0.14, bassEighths:false, fourFloor:true,  hatEvery:1}
  ];
  let curSong=0;
  function mVoice(time,freq,dur,type,vol,atk=0.005){
    const o=actx.createOscillator(), g=actx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,time);
    g.gain.setValueAtTime(0.0001,time); g.gain.linearRampToValueAtTime(vol,time+atk);
    g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    o.connect(g); g.connect(musicGain); o.start(time); o.stop(time+dur+0.02);
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
  function sfxRiser(){ if(!actx||muted) return; try{
    const o=actx.createOscillator(), g=actx.createGain(); o.type='sawtooth';
    o.frequency.setValueAtTime(180,actx.currentTime); o.frequency.exponentialRampToValueAtTime(1900,actx.currentTime+0.7);
    g.gain.setValueAtTime(0.0001,actx.currentTime); g.gain.linearRampToValueAtTime(0.22,actx.currentTime+0.55); g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+0.82);
    o.connect(g); g.connect(masterGain); o.start(); o.stop(actx.currentTime+0.85);
  }catch(e){} }
  function scheduleStep(step,time){
    const song=SONGS[curSong]||SONGS[0];
    const lead=(loopCount%2===1)?song.lead2:song.lead1;
    const lv=song.leadVol||0.16;
    for(const e of lead) if(e.s===step) mVoice(time,midiF(e.n),e.d*secPerStep*0.92,song.lt,lv);
    const block=Math.floor(step/16), ls=step%16, root=song.bass[block];
    if(song.bassEighths){ if(ls%2===0) mVoice(time,midiF(root),secPerStep*1.5,'triangle',0.27,0.004); } // treibender Achtel-Bass
    else { if(ls%4===0) mVoice(time,midiF(root),secPerStep*2,'triangle',0.30,0.004); else if(ls%4===2) mVoice(time,midiF(root+7),secPerStep*1.4,'triangle',0.16); }
    if(step%2===0){ const ch=song.chords[block]; mVoice(time,midiF(ch[(step/2)%ch.length]+12),secPerStep*0.8,'square',0.06,0.002); }
    if(song.fourFloor){ if(ls%4===0) mKick(time); } else { if(ls===0||ls===8) mKick(time); }
    if(ls===4||ls===12) mNoise(time,0.12,0.16,1800);
    if(state===S.PLAY && ls%(song.hatEvery||2)===0) mNoise(time,0.025,0.05,8000);
    if(loopCount%2===1 && step>=60) mNoise(time,0.04,0.12,5000);
  }
  function scheduler(){
    if(!actx) return;
    if(nextStepTime < actx.currentTime) nextStepTime = actx.currentTime + 0.05; // Resync nach Tab-Wechsel
    while(nextStepTime < actx.currentTime+0.1){
      scheduleStep(step16,nextStepTime);
      nextStepTime+=secPerStep; step16++;
      if(step16>=64){ step16=0; loopCount++; }
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
    canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }
  window.addEventListener('resize',resize); resize();
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
  function spawnParticles(x,y,color,n,spd){ for(let i=0;i<n;i++){const a=Math.random()*6.28,s=rand(spd*0.3,spd);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:rand(0.012,0.03),color,size:rand(2,5)});} }
  function floatText(x,y,text,color,size){ floaters.push({x,y,text,color:color||'#fff',size:size||16,life:1,vy:-42}); }
  function hexA(h,a){ const n=parseInt(h.slice(1),16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }

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
    {id:'shieldgen',ico:'🛡️',name:'Schildgenerator',desc:'+1 Schild jetzt & +1 nach jedem Boss',max:3,apply:()=>{shields=Math.min(shields+1,6);mods.shieldPerBoss++;}},
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
    {id:'smol',ico:'🫠',name:'Smol Brain',desc:'Hitbox +28% (dicke Erbse), dafür +2 Schild',max:1,curse:true,apply:()=>{mods.playerR*=1.28;player.r=mods.playerR;shields=Math.min(shields+2,6);}},
    {id:'energy',ico:'⚡',name:'Energy-Drink-OD',desc:'Hindernisse +22% schneller, Near-Radius +75%',max:1,curse:true,apply:()=>{mods.obSpeed*=1.22;mods.nearRadius*=1.75;}},
    {id:'blind',ico:'🌫️',name:'Drip aber blind',desc:'Sicht eingeschränkt, dafür +90% Punkte',max:1,curse:true,apply:()=>{mods.fog=Math.min(0.82,mods.fog+0.55);mods.scoreMult*=1.9;}},
    {id:'clown',ico:'🤡',name:'Clown-Modus',desc:'30% dichteres Gedränge, aber Orbs ×2 Punkte',max:1,curse:true,apply:()=>{mods.spawnMult*=0.7;mods.orbValueMult*=2;}},
    {id:'mirror',ico:'🪞',name:'Spiegelwelt',desc:'Links/rechts vertauscht 💀, dafür +55% Punkte',max:1,curse:true,apply:()=>{mods.invertX=!mods.invertX;mods.scoreMult*=1.55;}},
    // ---- Globale Waffen-Passive (KEIN Slot, gelten für alle Waffen, multiplikativ = abnehmender Ertrag) ----
    {id:'amp',  ico:'💥',name:'Verstärker',desc:'+18% Schaden für ALLE Waffen',max:5,wpass:true,apply:()=>{ mods.wDmgMult*=1.18; }},
    {id:'tempo',ico:'⏩',name:'Taktung',   desc:'ALLE Waffen feuern 12% schneller',max:4,wpass:true,apply:()=>{ mods.wRate*=1.12; }}
  ];
  // ---- ARSENAL: 5 eigenständige Auto-Feuer-Waffen, je mit 2 Skill-Gabelungen (D2-light) ----
  // Jede Waffe belegt 1 Slot. Pfad-Wahl = Sidegrade (gleich stark, anderer Stil).
  const WEAPONS=[
    {id:'blaster',ico:'🔫',col:'#caffff',forks:[['rapid','heavy'],['scatter','precise']]},
    {id:'missile',ico:'🚀',col:'#ff9a2e',forks:[['swarm','warhead'],['shrapnel','incendiary']]},
    {id:'flame',  ico:'🔥',col:'#ffae4d',forks:[['ember','wildfire'],['accel','consume']]},
    {id:'frost',  ico:'❄️',col:'#8fe8ff',forks:[['permafrost','glaciate'],['shatter','brittle']]},
    {id:'chain',  ico:'⛓️',col:'#9be7ff',forks:[['fork','highv'],['stormhit','dischargeaoe']]}
  ];
  const WID=Object.fromEntries(WEAPONS.map(w=>[w.id,w]));
  // Synergien (auto, wenn beide Waffen besessen). [id, [weaponA, weaponB], ico]
  const SYNERGIES=[
    {id:'thermo', pair:['flame','frost'],  ico:'🌋'},
    {id:'super',  pair:['frost','chain'],  ico:'🔱'},
    {id:'napalm', pair:['missile','flame'],ico:'🧨'},
    {id:'tesla',  pair:['blaster','chain'],ico:'🌩️'},
    {id:'icebomb',pair:['frost','missile'],ico:'🧊'}
  ];
  let arsenal={slots:3,w:{}}, wpn={}, syn={};       // arsenal.w[id]={lvl,f1,f2}; wpn=aufgelöste Werte; syn=aktive Synergien
  const ownedW=()=>Object.keys(arsenal.w);
  const ownedCount=()=>ownedW().length;
  const synActive=id=>!!syn[id];
  // arsenal.w → aufgelöste Feuerwerte (wpn) + Synergie-Flags (syn). Nach jedem Pick/Drop & bei reset() aufrufen.
  function recalcArsenal(){
    const dm=mods.wDmgMult||1, rm=mods.wRate||1, has=id=>!!arsenal.w[id]; wpn={}; syn={};
    if(has('blaster')){ const a=arsenal.w.blaster; let rate=3.2,dmg=1,bolts=1,spread=0.13,pierce=0;
      if(a.f1==='rapid'){rate*=1.5;dmg*=0.8;} if(a.f1==='heavy'){rate*=0.7;dmg*=2.0;}
      if(a.f2==='scatter'){bolts+=2;spread+=0.06;dmg*=0.78;} if(a.f2==='precise'){pierce+=2;dmg*=1.4;}
      wpn.blaster={rate:rate*rm,dmg:dmg*dm,bolts,spread,pierce}; }
    if(has('missile')){ const a=arsenal.w.missile; let rate=0.55,dmg=3,aoe=70,count=1;
      if(a.f1==='swarm'){count=2;dmg*=0.62;aoe*=0.78;} if(a.f1==='warhead'){dmg*=1.55;aoe*=1.5;rate*=0.8;}
      wpn.missile={rate:rate*rm,dmg:dmg*dm,aoe,count,shrapnel:a.f2==='shrapnel',incendiary:a.f2==='incendiary'}; }
    if(has('flame')){ const a=arsenal.w.flame; let rate=2.2,dmg=0.4,dot=1.1,dur=2.0;
      if(a.f1==='ember'){dot*=1.9;} let spread=a.f1==='wildfire';
      if(a.f2==='accel'){dot*=1.5;dur*=0.6;}
      wpn.flame={rate:rate*rm,dmg:dmg*dm,dot:dot*dm,dur,spread,consume:a.f2==='consume'}; }
    mods.brittle=false; mods.shatter=false;
    if(has('frost')){ const a=arsenal.w.frost; let rate=1.9,dmg=0.5,slowDur=1.4,slowAmt=0.5;
      if(a.f1==='permafrost'){slowDur*=1.9;slowAmt=0.32;} let freeze=a.f1==='glaciate';
      wpn.frost={rate:rate*rm,dmg:dmg*dm,slowDur,slowAmt,freeze,shatter:a.f2==='shatter',brittle:a.f2==='brittle'};
      mods.brittle=a.f2==='brittle'; mods.shatter=a.f2==='shatter'; }   // SPRÖDE / SPLITTERBRUCH gelten global an gefrorenen Zielen
    if(has('chain')){ const a=arsenal.w.chain; let rate=1.1,dmg=1.4,jumps=3,stun=0;
      if(a.f1==='fork'){jumps+=2;dmg*=0.7;} if(a.f1==='highv'){jumps=Math.max(1,jumps-1);dmg*=1.9;stun=0.4;}
      wpn.chain={rate:rate*rm,dmg:dmg*dm,jumps,stun,onHit:a.f2==='stormhit',aoe:a.f2==='dischargeaoe'}; }
    for(const s of SYNERGIES) syn[s.id]=has(s.pair[0])&&has(s.pair[1]);
    if(syn.super&&wpn.chain) wpn.chain.jumps+=1;                 // SUPRALEITER: +1 Kettensprung
    mods.gun=has('blaster')?1:0;
  }
  // Waffen-Level/Fork-Logik: lvl1=Basis, lvl2=Gabelung1 gewählt, lvl3=Gabelung2 gewählt
  function nextNode(id){ const a=arsenal.w[id]; if(!a) return 'new'; if(!a.f1) return 'f1'; if(!a.f2) return 'f2'; return null; }
  function weaponMaxed(id){ return nextNode(id)===null; }

  function reset(){
    mods={nearRadius:30,scoreMult:1,playerR:13,follow:14,orbValueMult:1,magnetPassive:0,powerupRate:1,comboBonus:0,shieldPerBoss:0,slowmoMult:1,
          obSpeed:1,spawnMult:1,fog:0,invertX:false,
          gun:0,wDmgMult:1,wRate:1};
    arsenal={slots:3,w:{}}; wpn={}; syn={};
    player={x:W/2,y:H*0.72,r:mods.playerR,trail:[]};
    tgt.x=W/2; tgt.y=H*0.72;
    obstacles=[]; orbs=[]; powerups=[]; particles=[]; floaters=[]; lasers=[]; bullets=[]; gems=[];
    score=0; displayScore=0; combo=0; multiplier=1;
    elapsed=0; spawnT=0; orbT=0; powerupT=rand(5,9); difficulty=1;
    shake=0; flash=0; flashColor='#19f0ff'; nearGlow=0; nearCount=0;
    level=1; levelDuration=(mode==='hardcore')?12:16; levelTimer=levelDuration; unlocked=['straight'];
    upStep=450; nextUpgradeAt=450;
    bossActive=false; bossNumber=1; bossTimer=(mode==='hardcore')?16:22; bossPhaseT=0; laserSpawnT=0;
    banner=null; effects={slowmo:0,magnet:0,double:0}; shields=0; invuln=0; upgradeCounts={}; lives=3;
    curSong=0; curBg=cloneTheme(THEMES[0]); commentT=rand(12,20); egg67done=false; egg67T=0;
    comboTime=0; comboTimeMax=3.4; beatIdx=0; beatPulse=0; spawnQueued=false; orbQueued=false;
    director=0.5; overdrive=false; tBlast=0; tMiss=rand(0.3,0.7); tFlame=0; tFrost=0; tChain=rand(0.4,0.8); teslaCount=0; bossPending=false; boss=null; ebullets=[]; gemT=rand(8,13);
    endless=false; madness=0; wonThisRun=false; laserFinal=false;
    runOrbs=0; runPerfect=0; runBosses=0; madnessTime=0; runMaxMult=1;
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
    return d; }
  // Effektive Einzelziel-DPS gegen den Boss (kein Flächen-Bonus, Raketen ×2 wie in explodeMissile)
  function bossDps(){ let d=0.5;
    if(wpn.blaster) d+=wpn.blaster.dmg*wpn.blaster.bolts*wpn.blaster.rate;
    if(wpn.missile) d+=wpn.missile.dmg*wpn.missile.count*wpn.missile.rate*2;
    if(wpn.flame)   d+=(wpn.flame.dmg+wpn.flame.dot*wpn.flame.dur)*wpn.flame.rate;
    if(wpn.frost)   d+=wpn.frost.dmg*wpn.frost.rate;
    if(wpn.chain)   d+=wpn.chain.dmg*wpn.chain.rate;
    return d; }
  function pwrSurv(){ let up=0; for(const k in upgradeCounts) up+=upgradeCounts[k];
    return up*0.6 + shields*0.4 + Math.max(0,lives-3)*0.5 + (13-mods.playerR)/13*4
      + Math.max(0,(mods.nearRadius-30)/30) + Math.max(0,(mods.follow-14)/8) + Math.max(0,mods.scoreMult-1); }
  const difSpd =()=>1+Math.min(0.7,pwrSurv()*0.026)+(endless?madness*0.85:0);     // Obstacles schneller (sanfter)
  const difDen =()=>Math.max(0.32,1-Math.min(0.35,pwrSurv()*0.015)-(endless?madness*0.35:0)); // dichter (sanfter)
  // Obstacles-HP skaliert mit Gesamt-DPS → konstante Time-to-Kill (robustester Balance-Hebel)
  const difHp  =()=>1+gunDps()*0.5;
  function finalNum(){ return mode==='hardcore'?10:8; }
  function startGame(m){
    if(m==='daily'){ daily=true; mode='normal'; }
    else if(m){ daily=false; mode=m; }       // m leer (NOCHMAL) → vorigen Typ beibehalten
    useSeed=daily;
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
    document.getElementById('settings').classList.add('hidden'); document.getElementById('ach').classList.add('hidden'); document.getElementById('skins').classList.add('hidden');
    document.getElementById('loadout').classList.add('hidden'); document.getElementById('arsenalView').classList.add('hidden');
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
    sfx67(); vibe([67,67,67]); addScore(67); shields=Math.min(shields+1,6); flash=0.55; flashColor='#ffe600';
    for(let i=0;i<18;i++) floatText(rand(40,W-40),rand(H*0.2,H*0.8),'6 7',pick(['#ffe600','#19f0ff','#ff2e88']),rand(16,30));
    spawnParticles(player.x,player.y,'#ffe600',26,300);
  }

  // ---------- Spawning ----------
  function pickPattern(){ if(unlocked.length===1) return 'straight';
    if(grnd()<0.4) return 'straight'; return gpick(unlocked.slice(1)); }
  function spawnObstacle(){
    const key=pickPattern();
    const hc=mode==='hardcore'?1.5:1, zc=mode==='zen'?0.75:1;
    const sp=(110+level*13+Math.min(elapsed*4,150))*hc*zc*(mods.obSpeed||1)*(1+(director-0.5)*0.12)*difSpd();
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
    o.maxHp=Math.max(1,Math.round(((o.w+o.h)/46+(o.shape==='long'?2:0)+(o.shape==='rect'?1:0))*difHp()));
    o.hp=o.maxHp; o.hitFlash=0;
    obstacles.push(o);
  }
  function spawnOrb(){ orbs.push({x:grand(30,W-30),y:-20,r:9,vy:90+difficulty*30,pulse:Math.random()*6.28}); }
  const PUP=['shield','slow','magnet','bomb','double'];
  const PUPINFO={shield:{c:'#2effc0',g:'🛡'},slow:{c:'#5b9bff',g:'⏱'},magnet:{c:'#c45bff',g:'🧲'},bomb:{c:'#ff9a2e',g:'💣'},double:{c:'#ffe600',g:'✕2'}};
  function spawnPowerup(){ const t=gpick(PUP); powerups.push({x:grand(40,W-40),y:-24,r:16,vy:80+difficulty*18,type:t,pulse:Math.random()*6.28}); }
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
      maxHp:Math.max(30,Math.round(bossDps()*(8+bossNumber*0.8)*(final?2.0:1))), hp:0, t:0,
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
  function startBossDeath(){ boss.dead=true; boss.deathT=1.2; ebullets=[];
    flash=0.7; flashColor='#ffe600'; shake=22; effects.slowmo=Math.max(effects.slowmo,1.0);
    sfxWin(); sfxKill(); pixelBurst(boss.x,boss.y,'#ffe600',12); vibe([120,60,160]); }
  function defeatMegaBoss(){ const wasFinal=boss&&boss.final;
    const bonus=(wasFinal?600:160)*multiplier*bossNumber, chips=(wasFinal?120:20)+bossNumber*8;
    addScore(bonus); meta.chips=(meta.chips||0)+chips; saveMeta(); updateMenuChips();
    pixelBurst(W/2,H*0.28,'#2effc0',wasFinal?28:16); spawnParticles(W/2,H*0.28,'#ffe600',wasFinal?60:30,320);
    flash=0.6; flashColor='#2effc0'; sfxWin(); vibe([20,30,40]); runBosses++; unlockAch('mega');
    for(let i=0;i<mods.shieldPerBoss;i++) shields=Math.min(shields+1,6);
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
  function bossFlee(){ banner={text:t('escaped'),sub:t('escapedSub'),t:2.4,color:'#9a86c9'};
    beep(300,0.3,'sawtooth',0.3,-120); vibe(40); ebullets=[];
    boss=null; bossActive=false; bossNumber++; bossTimer=(mode==='hardcore')?24:30; }
  function updateMegaBoss(dt,ts){ const B=boss;
    if(B.dead){ B.deathT-=dt; B.x+=rand(-2,2); B.y+=rand(-2,2);
      if(Math.random()<0.6) pixelBurst(B.x+rand(-B.r,B.r),B.y+rand(-B.r,B.r),pick(['#ffe600','#ff2e88','#19f0ff','#2effc0']),2);
      if(B.deathT<=0) defeatMegaBoss(); return; }
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
    for(let i=0;i<mods.shieldPerBoss;i++) shields=Math.min(shields+1,6);
    bossNumber++; runBosses++;
    if(wasFinal){ const chips=120+bossNumber*8; meta.chips=(meta.chips||0)+chips; saveMeta(); updateMenuChips(); winGame(); }
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
    const ns=(level-1)%SONGS.length; if(ns!==curSong){ curSong=ns; sfxRiser(); floatText(W/2,H*0.44,'♪ '+SONGS[ns].name,'#ffe600',20); }
    banner={text:t('lvl')+' '+level,sub,t:2.6,color:'#19f0ff'}; sfxLevel(); vibe([20,25,20]);
    flash=0.4; flashColor='#19f0ff';
  }
  // Alle gerade wählbaren Angebote: neue Waffe (nur bei freiem Slot), Skill-Gabelung, Passiv-Upgrade
  function offerPool(){ const out=[];
    if(opt.guns && ownedCount()<arsenal.slots){ for(const w of WEAPONS){ if(!arsenal.w[w.id]) out.push({kind:'new',wid:w.id}); } }
    if(opt.guns){ for(const id of ownedW()){ const node=nextNode(id); if(node){ const opts=WID[id].forks[node==='f1'?0:1];
      out.push({kind:'fork',wid:id,slot:node,path:opts[0]}); out.push({kind:'fork',wid:id,slot:node,path:opts[1]}); } } }
    for(const u of UPGRADES){ if(u.curse||u.pickup) continue; if((upgradeCounts[u.id]||0)>=u.max) continue;
      if(u.wpass && (!opt.guns||ownedCount()===0)) continue; out.push({kind:'pass',u}); }
    return out; }
  function openUpgrade(armed){ state=S.UPGRADE; sfxUpgrade(); vibe([30,20,30]);
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
  function closeUpgrade(){ document.getElementById('upgrade').classList.add('hidden'); state=S.PLAY; invuln=Math.max(invuln,1.0);
    upStep=Math.round(upStep*1.6); nextUpgradeAt=score+upStep; lastT=performance.now(); }
  function chooseOffer(o){ const before=Object.assign({},syn); let label='';
    if(o.kind==='new'){ arsenal.w[o.wid]={lvl:1,f1:null,f2:null}; label=wName(o.wid); }
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
    if(shields>0){ shields--; invuln=1.1; flash=0.5; flashColor='#2effc0'; shake=14;
      spawnParticles(player.x,player.y,'#2effc0',22,260); sfxShieldBreak(); vibe([30,40,30]);
      floatText(player.x,player.y-26,t('shieldGone'),'#2effc0',18); return false; }
    if(mode==='zen'){ combo=0; multiplier=1; invuln=0.8; flash=0.5; flashColor='#ff2e88'; shake=12;
      spawnParticles(player.x,player.y,'#ff2e88',16,220); beep(200,0.18,'square',0.3,-80); vibe(40);
      floatText(player.x,player.y-24,t('comboGoneZ'),'#ff2e88',16); return false; }
    lives--;
    if(lives>0){ invuln=1.25; flash=0.6; flashColor='#ff2e88'; shake=16; combo=0; multiplier=1;
      spawnParticles(player.x,player.y,'#ff4d6d',26,300); sfxShieldBreak(); beep(220,0.3,'sawtooth',0.4,-120); vibe([70,40,70]);
      floatText(player.x,player.y-28,t('lifeLost'),'#ff4d6d',20); banner={text:lives+t('livesLeft'),sub:'',t:1.3,color:'#ff4d6d'}; return false; }
    gameOver(); return true;
  }

  // ---------- Update ----------
  function update(dt){
    elapsed+=dt; const dGrow=mode==='hardcore'?0.05:0.038; difficulty=1+Math.min(elapsed,150)*dGrow;
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
          // Kurz vor dem Boss: Arsenal anbieten (nur wenn Waffen-Karten verfügbar)
          const armUp=opt.guns&&offerPool().some(o=>o.kind!=='pass');
          if(armUp){ bossPending=true; openUpgrade(true); return; } else startBoss();
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
        spawnT=Math.max(0.34,(1.0-difficulty*0.045-level*0.013)*(mods.spawnMult||1)*(1-(director-0.5)*0.28)*difDen()); } }
    if(mode!=='hardcore'){ orbT-=dt; if(orbT<=0) orbQueued=true;
      if(orbQueued && onStep && step8%2===1){ spawnOrb(); orbQueued=false; orbT=rand(0.9,1.8); } }
    powerupT-=dt; if(powerupT<=0){ spawnPowerup(); powerupT=rand(10,16)/mods.powerupRate; }
    // Auto-Fire (sobald eine Waffe ausgerüstet ist)
    // Auto-Fire pro Waffe (touch-freundlich: feuert selbstständig sobald Cooldown bereit, Zielen automatisch)
    if(opt.guns){
      if(wpn.blaster){ tBlast-=dt; if(tBlast<=0){ fireBlaster(); tBlast=1/wpn.blaster.rate; } }
      if(wpn.missile){ tMiss-=dt;  if(tMiss<=0){  fireMissileW(); tMiss=1/wpn.missile.rate; } }
      if(wpn.flame){   tFlame-=dt; if(tFlame<=0){ fireFlame();    tFlame=1/wpn.flame.rate; } }
      if(wpn.frost){   tFrost-=dt; if(tFrost<=0){ fireFrost();    tFrost=1/wpn.frost.rate; } }
      if(wpn.chain){   tChain-=dt; if(tChain<=0){ fireChainW();   tChain=1/wpn.chain.rate; } }
    }
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
        if(Math.random()<0.5) spawnParticles(o.cx+rand(-7,7),o.cy+rand(-7,7),'#ff9a2e',1,70);
        if(o.hp<=0){ if(o.burnConsume) addScore(6); killObstacle(o); obstacles.splice(i,1); continue; } }
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
          let dmg=b.dmg; if(o.slow>0 && mods.brittle) dmg*=1.5;                          // SPRÖDE: +50% an Gefrorenen
          o.hp-=dmg; o.hitFlash=0.12; spawnParticles(b.x,b.y,b.col||'#caffff',3,120);
          if(b.burn){ o.burn=Math.max(o.burn||0,b.burnDur||1.8); o.burnDmg=Math.max(o.burnDmg||0,b.burn); o.burnSpread=b.burnSpread; o.burnConsume=b.burnConsume; }
          if(b.frost){ o.slow=Math.max(o.slow||0,b.frostDur||1.4); const amt=(b.freeze&&Math.random()<0.4)?0.05:b.frost; o.slowAmt=Math.min(o.slowAmt!=null?o.slowAmt:1,amt); spawnParticles(b.x,b.y,'#8fe8ff',2,80); }
          if(b.tesla){ chainLightning(o.cx,o.cy,(wpn.chain?wpn.chain.dmg:1.4)*0.8,2,{skip:[o]}); }  // TESLA-SALVE
          if(o.hp<=0){ const ox=o.cx,oy=o.cy,wasSlow=o.slow>0; killObstacle(o); obstacles.splice(oi,1);
            if(mods.shatter && wasSlow) shatterBurst(ox,oy,b.dmg);                        // SPLITTERBRUCH: Splitter-Explosion
            if(wpn.chain && wpn.chain.onHit) chainLightning(ox,oy,wpn.chain.dmg*0.7,2,{}); } // GEWITTER: Kette auch bei Bolzen-Kill
          if(b.pierce>0){ b.pierce--; } else { gone=true; }
          break;
        }
      }
      // Bolzen/Rakete gegen Mega-Boss
      if(!gone && boss && !boss.dead){ const bdx=b.x-boss.x, bdy=b.y-boss.y, br=boss.r+b.r;
        if(bdx*bdx+bdy*bdy<br*br){
          if(b.homing){ explodeMissile(b); gone=true; }
          else { boss.hp-=b.dmg; boss.hitFlash=0.07; spawnParticles(b.x,b.y,'#ffe600',3,150); beep(660,0.03,'square',0.05,120);
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
        spawnParticles(orb.x,orb.y,'#19f0ff',14,220); sfxOrb(combo); bumpCombo(); vibe(8); floatText(orb.x,orb.y-14,'+'+g,'#19f0ff',15);
        flash=Math.min(0.5,flash+0.18); flashColor='#19f0ff'; orbs.splice(i,1); continue; }
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
    for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.life-=p.decay; if(p.life<=0)particles.splice(i,1); }
    for(let i=floaters.length-1;i>=0;i--){ const f=floaters[i]; f.y+=f.vy*dt; f.vy*=0.96; f.life-=dt*0.9; if(f.life<=0)floaters.splice(i,1); }

    if(banner){ banner.t-=dt; if(banner.t<=0) banner=null; }
    displayScore+=(score-displayScore)*Math.min(1,dt*10);
    shake=Math.max(0,shake-dt*60); flash=Math.max(0,flash-dt*1.5); nearGlow=Math.max(0,nearGlow-dt*2);
    scoreEl.textContent=fmt(displayScore); comboEl.textContent='x'+multiplier;
    const cf=(combo>0&&comboTimeMax>0)?Math.max(0,Math.min(1,comboTime/comboTimeMax)):0;
    comboFillEl.style.transform='scaleX('+cf+')'; comboBarEl.classList.toggle('on',combo>0);
  }

  function doNear(o){ combo+=1+mods.comboBonus; setMult(); refillCombo(); const g=5*multiplier; addScore(g);
    spawnParticles(player.x,player.y,'#ffe600',6,160); sfxNear(); bumpCombo(); vibe(8);
    director=Math.min(1,director+0.025);
    floatText(player.x+rand(-10,10),player.y-20,'+'+g,'#ffe600',14); nearGlow=Math.min(1,nearGlow+0.5); nearCount++;
    unlockAch('firstNear');
    if(nearCount%5===0){ floatText(player.x,player.y-46,pick(P('near')),'#19f0ff',22); shake=Math.max(shake,7); vibe([10,15]); } }
  // Ultra-knapper Ausweicher → Extra-Bonus
  function perfectDodge(o){ const pb=Math.round(8*multiplier); addScore(pb); combo++; setMult(); refillCombo();
    floatText(player.x,player.y-50,t('perfect'),'#ff2e88',24); beep(1200,0.1,'square',0.2,520);
    flash=Math.min(0.6,flash+0.2); flashColor='#ff2e88'; nearGlow=1; shake=Math.max(shake,8); vibe([12,18,12]);
    director=Math.min(1,director+0.05); spawnParticles(player.x,player.y,'#ff2e88',10,240);
    runPerfect++; if(statN('perfect')+runPerfect>=10) unlockAch('perfect10'); }
  // ---------- Schuss / Explosionen ----------
  function fireBlaster(){ const w=wpn.blaster, n=w.bolts, spd=640, baseY=player.y-player.r-2;
    let teslaShot=false; if(syn.tesla){ teslaCount++; teslaShot=(teslaCount%5===0); }   // TESLA-SALVE: jeder 5. Bolzen verzweigt
    for(let i=0;i<n;i++){ const ang=(i-(n-1)/2)*w.spread;
      bullets.push({x:player.x,y:baseY,vx:Math.sin(ang)*spd,vy:-Math.cos(ang)*spd,r:5,dmg:w.dmg,pierce:w.pierce,col:'#caffff',tesla:teslaShot}); }
    particles.push({x:player.x,y:baseY,vx:0,vy:-30,life:1,decay:0.14,color:teslaShot?'#9be7ff':'#caffff',size:rand(5,8)});
    sfxShoot(); }
  function fireFlame(){ const w=wpn.flame, baseY=player.y-player.r-2;
    bullets.push({x:player.x,y:baseY,vx:rand(-30,30),vy:-560,r:6,dmg:w.dmg,pierce:0,col:'#ffae4d',burn:w.dot,burnDur:w.dur,burnSpread:w.spread,burnConsume:w.consume});
    particles.push({x:player.x,y:baseY,vx:0,vy:-20,life:1,decay:0.12,color:'#ff9a2e',size:rand(5,9)});
    beep(360,0.04,'sawtooth',0.07,90); }
  function fireFrost(){ const w=wpn.frost, baseY=player.y-player.r-2;
    bullets.push({x:player.x,y:baseY,vx:rand(-20,20),vy:-600,r:5,dmg:w.dmg,pierce:1,col:'#8fe8ff',frost:w.slowAmt,frostDur:w.slowDur,freeze:w.freeze,shatter:w.shatter,brittle:w.brittle});
    particles.push({x:player.x,y:baseY,vx:0,vy:-20,life:1,decay:0.12,color:'#8fe8ff',size:rand(4,7)});
    beep(880,0.04,'sine',0.06,240); }
  function fireMissileW(){ const w=wpn.missile; for(let i=0;i<w.count;i++){
      bullets.push({x:player.x+rand(-8,8),y:player.y-player.r-2,vx:rand(-50,50),vy:-340,r:7,dmg:w.dmg,pierce:0,homing:true,aoe:w.aoe,life:4,col:'#ff9a2e',shrapnel:w.shrapnel,incendiary:w.incendiary}); }
    beep(300,0.05,'square',0.12,160); }
  function fireChainW(){ const w=wpn.chain;
    if(boss&&!boss.dead){ const dx=boss.x-player.x,dy=boss.y-player.y; if(dx*dx+dy*dy<260*260){
      boss.hp-=w.dmg; boss.hitFlash=0.07; arcParticles(player.x,player.y-player.r,boss.x,boss.y); beep(1200,0.03,'square',0.08,260); if(boss.hp<=0)startBossDeath(); return; } }
    let best=null,bd=99999; for(const o of obstacles){ const dx=o.cx-player.x,dy=o.cy-player.y,d=dx*dx+dy*dy; if(d<bd){bd=d;best=o;} }
    if(!best) return; arcParticles(player.x,player.y-player.r,best.cx,best.cy);
    let dd=w.dmg; if(syn.super&&best.slow>0) dd*=1.5;
    best.hp-=dd; best.hitFlash=0.1; if(w.stun){ best.slow=Math.max(best.slow||0,w.stun); best.slowAmt=Math.min(best.slowAmt!=null?best.slowAmt:1,0.1); }
    if(w.aoe) chainAoe(best.cx,best.cy,dd*0.5);
    const fx=best.cx,fy=best.cy,skip=[best]; if(best.hp<=0){ killObstacle(best); const ix=obstacles.indexOf(best); if(ix>=0)obstacles.splice(ix,1); }
    chainLightning(fx,fy,w.dmg,w.jumps-1,{skip,stun:w.stun,aoe:w.aoe}); beep(1300,0.03,'square',0.06,260); }
  function pixelBurst(x,y,color,power){ const n=8+Math.min(20,(power||1)*5);
    for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=rand(80,270); particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:rand(0.02,0.045),color,size:rand(3,7)}); }
    for(let i=0;i<4;i++){ const a=Math.random()*6.28,s=rand(40,160); particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:0.05,color:'#ffffff',size:rand(3,6)}); } }
  function killObstacle(o){ const pts=3*(o.maxHp||1); addScore(pts);
    pixelBurst(o.cx,o.cy,o.color,o.maxHp); floatText(o.cx,o.cy-12,'+'+pts,o.color,14);
    sfxKill(); flash=Math.min(0.5,flash+0.12); flashColor=o.color; vibe(o.maxHp>=3?[18,14]:6);
    shake=Math.max(shake,o.maxHp>=3?6:3); director=Math.min(1,director+0.008);
    if(o.burnSpread){ for(const n of obstacles){ if(n===o) continue; const dx=n.cx-o.cx,dy=n.cy-o.cy;  // FLÄCHENBRAND
      if(dx*dx+dy*dy<92*92){ n.burn=Math.max(n.burn||0,1.6); n.burnDmg=Math.max(n.burnDmg||0,(o.burnDmg||0.8)*0.8); n.burnSpread=true; } } } }
  // Lenkrakete: dreht sich zum nächsten Ziel und beschleunigt
  function steerMissile(b,dt){ let tx=null,ty=null,bd=1e9;
    for(const o of obstacles){ const dx=o.cx-b.x,dy=o.cy-b.y,d=dx*dx+dy*dy; if(d<bd){bd=d;tx=o.cx;ty=o.cy;} }
    if(boss&&!boss.dead){ const dx=boss.x-b.x,dy=boss.y-b.y,d=dx*dx+dy*dy; if(d<bd){bd=d;tx=boss.x;ty=boss.y;} }
    let spd=Math.hypot(b.vx,b.vy)||340; spd=Math.min(560,spd+520*dt);
    if(tx!==null){ const desired=Math.atan2(ty-b.y,tx-b.x), cur=Math.atan2(b.vy,b.vx);
      let dA=((desired-cur+Math.PI*3)%(Math.PI*2))-Math.PI; dA=Math.max(-3.4*dt,Math.min(3.4*dt,dA));
      const na=cur+dA; b.vx=Math.cos(na)*spd; b.vy=Math.sin(na)*spd; }
    else { const m=Math.hypot(b.vx,b.vy)||1; b.vx=b.vx/m*spd; b.vy=b.vy/m*spd; } }
  // Rakete explodiert: AoE-Schaden an allen Zielen im Radius (+ Splitter/Napalm/Eisbombe)
  function explodeMissile(b){ const R=b.aoe||64;
    pixelBurst(b.x,b.y,'#ff9a2e',6); spawnParticles(b.x,b.y,'#ffe600',16,300);
    flash=Math.min(0.5,flash+0.14); flashColor='#ff9a2e'; shake=Math.max(shake,6); beep(140,0.16,'sawtooth',0.3,-60); vibe([18,12]);
    for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-b.x,dy=o.cy-b.y;
      if(dx*dx+dy*dy<R*R){ o.hp-=b.dmg; o.hitFlash=0.12;
        if(b.incendiary||syn.napalm){ o.burn=Math.max(o.burn||0,2.2); o.burnDmg=Math.max(o.burnDmg||0,1.0*(mods.wDmgMult||1)); }  // Brandsatz / NAPALM
        if(syn.icebomb){ o.slow=Math.max(o.slow||0,1.6); o.slowAmt=Math.min(o.slowAmt!=null?o.slowAmt:1,0.45); }                 // EISBOMBE
        if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } }
    if(b.shrapnel){ for(let i=0;i<8;i++){ const a=i/8*6.28; bullets.push({x:b.x,y:b.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:3,dmg:b.dmg*0.4,pierce:0,col:'#ffd36b',life:0.5,frag:true}); } } // Splittergranate
    if(boss&&!boss.dead){ const dx=boss.x-b.x,dy=boss.y-b.y; if(dx*dx+dy*dy<(R+boss.r)*(R+boss.r)){ boss.hp-=b.dmg*2; boss.hitFlash=0.07; if(boss.hp<=0) startBossDeath(); } } }
  // Splitterbruch: gefrorenes Ziel zerspringt beim Tod → Scherben-AoE
  function shatterBurst(x,y,dmg){ const R=70; spawnParticles(x,y,'#bdefff',14,260); beep(900,0.06,'square',0.12,-200); shake=Math.max(shake,5);
    for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-x,dy=o.cy-y;
      if(dx*dx+dy*dy<R*R){ o.hp-=dmg*1.2; o.hitFlash=0.1; if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } } }
  // Kleiner AoE-Puls (Entladung-Fork des Kettenblitzes)
  function chainAoe(x,y,dmg){ const R=46; for(let k=obstacles.length-1;k>=0;k--){ const o=obstacles[k]; const dx=o.cx-x,dy=o.cy-y;
      if(dx*dx+dy*dy<R*R){ o.hp-=dmg; o.hitFlash=0.1; if(o.hp<=0){ killObstacle(o); obstacles.splice(k,1); } } } spawnParticles(x,y,'#9be7ff',5,120); }
  // Kettenblitz: springt von Ziel zu Ziel (jumps), +50% an Gefrorenen via SUPRALEITER
  function chainLightning(x,y,dmg,jumps,opts){ opts=opts||{}; let cx=x,cy=y; const used=new Set(opts.skip||[]);
    for(let h=0;h<jumps;h++){ let best=null,bd=150*150; for(const o of obstacles){ if(used.has(o)) continue; const dx=o.cx-cx,dy=o.cy-cy,d=dx*dx+dy*dy; if(d<bd){bd=d;best=o;} }
      if(!best) break; used.add(best); arcParticles(cx,cy,best.cx,best.cy);
      let dd=dmg; if(syn.super&&best.slow>0) dd*=1.5;
      best.hp-=dd; best.hitFlash=0.1; if(opts.stun){ best.slow=Math.max(best.slow||0,opts.stun); best.slowAmt=Math.min(best.slowAmt!=null?best.slowAmt:1,0.1); }
      if(opts.aoe) chainAoe(best.cx,best.cy,dd*0.5);
      const nx=best.cx,ny=best.cy;
      if(best.hp<=0){ killObstacle(best); const ix=obstacles.indexOf(best); if(ix>=0) obstacles.splice(ix,1); }
      cx=nx; cy=ny; } }
  function arcParticles(x1,y1,x2,y2){ for(let i=0;i<=5;i++){ const tt=i/5; spawnParticles(x1+(x2-x1)*tt,y1+(y2-y1)*tt,'#9be7ff',1,50); } beep(1100,0.03,'square',0.07,260); }

  function collectPup(p){ sfxPow(); vibe([15,15,15]); spawnParticles(p.x,p.y,PUPINFO[p.type].c,18,240); flash=0.4; flashColor=PUPINFO[p.type].c;
    if(p.type==='shield'){ shields=Math.min(shields+1,6); floatText(p.x,p.y-18,t('pSchild'),'#2effc0',16); }
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
      // lasers
      for(const L of lasers){ ctx.save();
        if(L.state==='warn'){ const a=0.25+0.35*Math.abs(Math.sin(L.t*16)); ctx.strokeStyle=`rgba(255,230,0,${a})`; ctx.setLineDash([10,10]); ctx.lineWidth=3; ctx.shadowBlur=12; ctx.shadowColor='#ffe600'; ctx.beginPath();
          if(L.orient==='v'){ctx.moveTo(L.pos,0);ctx.lineTo(L.pos,H);}else{ctx.moveTo(0,L.pos);ctx.lineTo(W,L.pos);} ctx.stroke(); }
        else { const fd=1-L.t/L.fireDur; ctx.shadowBlur=30; ctx.shadowColor='#ff2e88';
          const grd=L.orient==='v'?ctx.createLinearGradient(L.pos-L.thick/2,0,L.pos+L.thick/2,0):ctx.createLinearGradient(0,L.pos-L.thick/2,0,L.pos+L.thick/2);
          grd.addColorStop(0,'rgba(255,46,136,0)');grd.addColorStop(.5,`rgba(255,255,255,${0.9*fd})`);grd.addColorStop(1,'rgba(255,46,136,0)'); ctx.fillStyle=grd;
          if(L.orient==='v')ctx.fillRect(L.pos-L.thick/2,0,L.thick,H); else ctx.fillRect(0,L.pos-L.thick/2,W,L.thick); }
        ctx.restore(); }

      // orbs
      for(const orb of orbs){ const pr=orb.r+Math.sin(orb.pulse)*2; ctx.save(); ctx.shadowBlur=24; ctx.shadowColor='#19f0ff'; ctx.fillStyle='#19f0ff';
        ctx.beginPath();ctx.arc(orb.x,orb.y,pr,0,6.28);ctx.fill(); ctx.fillStyle='#caffff';ctx.beginPath();ctx.arc(orb.x,orb.y,pr*0.45,0,6.28);ctx.fill(); ctx.restore(); }

      // power-ups
      for(const p of powerups){ const inf=PUPINFO[p.type], pr=p.r+Math.sin(p.pulse)*2; ctx.save(); ctx.shadowBlur=22; ctx.shadowColor=inf.c;
        ctx.fillStyle=hexA(inf.c,0.22); ctx.strokeStyle=inf.c; ctx.lineWidth=2.5; ctx.beginPath();ctx.arc(p.x,p.y,pr,0,6.28);ctx.fill();ctx.stroke();
        ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font='15px Space Mono, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(inf.g,p.x,p.y+1); ctx.restore(); }

      // sammel-symbole (rotierende raute, gold=positiv, pink=fluch)
      for(const g of gems){ const pr=g.r+Math.sin(g.pulse)*2, col=g.curse?'#ff2e88':'#ffe600'; ctx.save(); ctx.translate(g.x,g.y);
        ctx.shadowBlur=22; ctx.shadowColor=col; ctx.rotate(g.rot); ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.fillStyle=hexA(col,0.18);
        ctx.beginPath(); ctx.moveTo(0,-pr); ctx.lineTo(pr,0); ctx.lineTo(0,pr); ctx.lineTo(-pr,0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.rotate(-g.rot); ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font='15px Space Mono, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(g.u.ico,0,1); ctx.restore(); }

      // obstacles
      for(const o of obstacles){
        if(o.pattern!=='straight'&&o.trail.length){ for(let i=0;i<o.trail.length;i++){ const t=o.trail[i],a=i/o.trail.length;
          ctx.globalAlpha=a*0.28; ctx.fillStyle=o.color; ctx.beginPath(); ctx.arc(t.x,t.y,o.w*0.18*a,0,6.28); ctx.fill(); } ctx.globalAlpha=1; }
        ctx.save(); ctx.translate(o.cx,o.cy); ctx.rotate(o.rot||0);
        ctx.shadowBlur=(o.burn>0)?22:16; ctx.shadowColor=(o.burn>0)?'#ff9a2e':((o.slow>0)?'#8fe8ff':o.color);
        const oc=(o.hitFlash>0)?'#ffffff':((o.slow>0)?'#bdefff':o.color);
        if(o.shape==='ring'){ ctx.strokeStyle=oc; ctx.lineWidth=o.w*0.26; ctx.beginPath(); ctx.arc(0,0,o.w*0.4,0,6.28); ctx.stroke(); }
        else { ctx.strokeStyle=oc; ctx.lineWidth=3; ctx.fillStyle=hexA(o.color,o.hitFlash>0?0.4:0.16); shapePath(o.shape,o.w,o.h); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }

      // bolzen (neon-laser, skin-farbig) & raketen
      for(const b of bullets){ ctx.save();
        if(b.homing){ ctx.shadowBlur=16; ctx.shadowColor='#ff7a00';
          ctx.fillStyle='#ff6a00'; ctx.beginPath(); ctx.arc(b.x-b.vx*0.012,b.y-b.vy*0.012,b.r*0.8,0,6.28); ctx.fill();
          ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.28); ctx.fill();
          ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.4,0,6.28); ctx.fill(); }
        else { ctx.shadowBlur=14; ctx.shadowColor=b.col||'#19f0ff';
          ctx.strokeStyle=b.col||'#caffff'; ctx.lineWidth=b.r; ctx.lineCap='round';
          ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x-b.vx*0.022,b.y-b.vy*0.022); ctx.stroke();
          ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.5,0,6.28); ctx.fill(); }
        ctx.restore(); }

      // mega-boss + gegner-kugeln
      if(boss) drawBoss();
      for(const e of ebullets){ ctx.save(); ctx.shadowBlur=14; ctx.shadowColor='#ff2e88'; ctx.fillStyle='#ff5ea8';
        ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,6.28); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r*0.4,0,6.28); ctx.fill(); ctx.restore(); }

      // player trail
      for(let i=0;i<player.trail.length;i++){ const t=player.trail[i],a=i/player.trail.length; ctx.globalAlpha=a*0.5; ctx.fillStyle='#19f0ff'; ctx.beginPath(); ctx.arc(t.x,t.y,player.r*a*0.8,0,6.28); ctx.fill(); } ctx.globalAlpha=1;

      // player (mitwachsendes Pixel-Raumschiff)
      if(state===S.PLAY||state===S.UPGRADE||state===S.PAUSE){ const blink=invuln>0&&Math.floor(invuln*16)%2===0;
        if(!blink) drawShip();
        // shield rings
        for(let s=0;s<shields;s++){ ctx.save(); ctx.strokeStyle=hexA('#2effc0',0.8-s*0.12); ctx.lineWidth=2; ctx.shadowBlur=12; ctx.shadowColor='#2effc0';
          ctx.beginPath(); ctx.arc(player.x,player.y,player.r+9+s*5,0,6.28); ctx.stroke(); ctx.restore(); }
      }

      // particles
      for(const p of particles){ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.shadowBlur=10; ctx.shadowColor=p.color; ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size); } ctx.globalAlpha=1; ctx.shadowBlur=0;

      // floaters
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(const f of floaters){ ctx.globalAlpha=Math.max(0,f.life); ctx.fillStyle=f.color; ctx.shadowBlur=10; ctx.shadowColor=f.color;
        ctx.font='700 '+f.size+'px Orbitron, sans-serif'; ctx.fillText(f.text,f.x,f.y); } ctx.globalAlpha=1; ctx.shadowBlur=0;

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
  function buildShipSprite(r,up,nCan){
    const R=makeRng(shipSeed||1);
    const cp=Math.max(2,Math.round(r*0.34));                 // Pixel-Zellgröße
    const gh=8+Math.min(7,(up*0.45)|0), gw=4+Math.min(4,(up*0.3)|0);
    const wingLen=1+Math.min(5,(up*0.4)|0);
    const sk=curSkin(), hull=sk.hull, edge=sk.edge, acc=sk.rnd?SHIP_ACC[(R()*SHIP_ACC.length)|0]:sk.acc;
    const pad=(wingLen+3)*cp, cw=(gw*2+1)*cp+pad*2, ch=(gh*2+1)*cp+pad*2, ox=pad+gw*cp, oy=pad+gh*cp;
    const grid=new Map(), setc=(x,y,c)=>{ grid.set(x+','+y,c); grid.set((-x)+','+y,c); };
    const harm=2+((R()*3)|0), ph=R()*6.28, edges={};
    for(let y=-gh;y<=gh;y++){ const ny=(y+gh)/(2*gh); let hw;
      if(ny<0.16) hw=gw*0.16*(ny/0.16);
      else if(ny<0.62) hw=gw*(0.32+0.68*((ny-0.16)/0.46));
      else hw=gw*(1-0.45*((ny-0.62)/0.38));
      hw=Math.max(0,Math.round(hw*(1+0.12*Math.sin(ny*Math.PI*harm+ph)))); edges[y]=hw;
      for(let x=0;x<=hw;x++) setc(x,y,hull);
      setc(hw,y,edge);                                       // Neon-Kante
    }
    // Cockpit (hell)
    const cy0=-((gh*0.35)|0); for(let y=cy0;y<=cy0+2;y++){ setc(0,y,'#caffff'); setc(1,y,'#fff'); }
    // Akzent-Strähne mittig
    for(let y=-((gh*0.05)|0);y<=((gh*0.55)|0);y++) if(grid.has('0,'+y)) setc(0,y,acc);
    // Flügel (Akzent) seitlich
    for(let wy=((gh*0.18)|0);wy<=((gh*0.18)|0)+2;wy++){ const base=edges[wy]||gw; for(let k=1;k<=wingLen;k++) setc(base+k,wy,acc); }
    if(R()<0.6){ const fy=((gh*0.55)|0), base=edges[fy]||gw; for(let k=1;k<=Math.max(1,wingLen-1);k++) setc(base+k,fy,edge); } // Finnen
    // Kanonen vorne (mehr Striche = mehr Waffen)
    for(let i=0;i<nCan;i++){ const col=Math.round(((i+0.5)/Math.max(1,nCan)*2-1)*(gw-0.5)), len=2+((R()*3)|0);
      for(let k=0;k<=len;k++) grid.set(col+','+(-gh-1-k), (i%2?'#fff':acc)); }
    // Greebles (zufällige Detail-Pixel je Run)
    const keys=[...grid.keys()]; for(let i=0;i<3+((R()*5)|0);i++){ const p=keys[(R()*keys.length)|0].split(','); setc((+p[0]),(+p[1]), R()<0.5?'#fff':acc); }
    // backen
    const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const x=cv.getContext('2d');
    grid.forEach((c,k)=>{ const p=k.split(','), px=ox+(+p[0])*cp, py=oy+(+p[1])*cp; x.fillStyle=c; x.fillRect(px-cp/2,py-cp/2,cp,cp); });
    const nEng=Math.max(1,Math.min(4,1+((up/3)|0))), flameX=[];
    for(let i=0;i<nEng;i++) flameX.push((i-(nEng-1)/2)*Math.max(cp*1.4,(gw*cp)/Math.max(1,nEng)));
    return {cv,ox,oy,cp,acc,flameX,tailY:gh*cp+cp*0.5};
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
    // Pixel-Sprite
    ctx.shadowBlur=10; ctx.shadowColor=S.acc; ctx.drawImage(S.cv,-S.ox,-S.oy); ctx.shadowBlur=0;
    // dünner Hitbox-Ring (echte, kleine Hitbox)
    ctx.strokeStyle=hexA('#19f0ff',0.4); ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,r,0,6.28); ctx.stroke();
    ctx.restore(); }
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
    const wjx=1+0.07*Math.sin(B.t*5), wjy=1+0.07*Math.sin(B.t*5+1.6); ctx.scale(wjx,wjy);
    // Tentakel (hinter dem Körper, wedeln)
    for(const t of S.tents){ ctx.strokeStyle=t.col; ctx.lineWidth=S.cp; ctx.lineCap='round'; ctx.shadowBlur=10; ctx.shadowColor=t.col; ctx.beginPath(); ctx.moveTo(t.ox,B.r*0.45);
      for(let s=1;s<=t.len;s++) ctx.lineTo(t.ox+Math.sin(B.t*5+s*0.7+t.ph)*S.cp*1.4,B.r*0.45+s*S.cp*1.3); ctx.stroke(); }
    // Fühler (oben, wippen)
    for(const a of S.ants){ ctx.strokeStyle=a.col; ctx.lineWidth=Math.max(2,S.cp*0.4); ctx.shadowBlur=8; ctx.shadowColor=a.col;
      const tx=a.ox+Math.sin(B.t*4+a.ph)*S.cp*1.6, ty=-B.r*0.55-S.cp*2.6; ctx.beginPath(); ctx.moveTo(a.ox,-B.r*0.42); ctx.lineTo(tx,ty); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(tx,ty,S.cp*0.6,0,6.28); ctx.fill(); }
    // Körper-Sprite (gebacken) mit Neon-Glühen
    ctx.shadowBlur=22+tg*22; ctx.shadowColor=tg>0?'#ff2e88':S.pal[0]; ctx.drawImage(S.cv,-S.ox,-S.oy); ctx.shadowBlur=0;
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
    // HP-Leiste oben
    if(!B.dead){ const bw=Math.min(W*0.66,380), bx=W/2-bw/2, by=(mode!=='zen'?48:30), col=S.pal[0];
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

  function drawEffectHud(){
    const items=[]; if(effects.slowmo>0)items.push(['⏱',effects.slowmo,'#5b9bff',5*mods.slowmoMult]);
    if(effects.magnet>0)items.push(['🧲',effects.magnet,'#c45bff',6]); if(effects.double>0)items.push(['✕2',effects.double,'#ffe600',7]);
    let x=W/2-(items.length*40)/2+20; const y=H-46;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const it of items){ ctx.save(); ctx.font='14px Space Mono'; ctx.fillStyle='#fff'; ctx.shadowBlur=8; ctx.shadowColor=it[2]; ctx.fillText(it[0],x,y-8);
      ctx.shadowBlur=0; ctx.fillStyle=hexA(it[2],0.3); ctx.fillRect(x-16,y+6,32,4); ctx.fillStyle=it[2]; ctx.fillRect(x-16,y+6,32*Math.max(0,it[1]/it[3]),4); ctx.restore(); x+=40; }
  }

  function drawGrid(){ const hz=H*0.42,vx=W/2, bp=1+(beatPulse||0)*0.55+(overdrive?0.35:0); // bp = Beat-Puls (+Overdrive)
    const gc=curBg.grid, sc=curBg.sun;
    ctx.strokeStyle=`rgba(${gc[0]|0},${gc[1]|0},${gc[2]|0},${Math.min(0.6,0.24*bp)})`; ctx.lineWidth=1;
    for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(vx+i*40,hz);ctx.lineTo(vx+i*220,H);ctx.stroke();}
    const t=(elapsed||0)*0.5%1;
    for(let i=0;i<14;i++){const f=(i+t)/14,y=hz+Math.pow(f,2.2)*(H-hz); ctx.globalAlpha=Math.min(0.7,(0.1+f*0.25)*bp); ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();} ctx.globalAlpha=1;
    const sg=ctx.createRadialGradient(W/2,hz,4,W/2,hz,180); sg.addColorStop(0,`rgba(${sc[0]|0},${sc[1]|0},${sc[2]|0},${Math.min(0.7,0.4*bp)})`); sg.addColorStop(1,`rgba(${sc[0]|0},${sc[1]|0},${sc[2]|0},0)`); ctx.fillStyle=sg; ctx.fillRect(W/2-180,hz-180,360,360);
  }

  // ---------- Game Over ----------
  const QUIPS=[
    "Dein Pixel-Ich ist jetzt Teil des Bodenbelags.","Organspende war gestern. Heute: Pixelspende.",
    "Tod durch Quadrat. Wie würdevoll.","Die gute Nachricht: Es tat nur einen Frame lang weh.",
    "Du wirst nicht vermisst. Dein Highscore schon.","R.I.P. – Rendered In Pieces.",
    "Kein Respawn, kein Jenseits, nur dieser Bildschirm.","Selbst das Tutorial weint gerade.",
    "Der Block kam aus dem Nichts. Dein Talent auch.","Reflexe wie ein Faultier im Winterschlaf.",
    "Glückwunsch! Du hast den Boden gefunden.","Game Over. Aber immerhin stilvoll explodiert.",
    "Die Synthwave-Götter schütteln den Kopf.","Du hattest EINE Aufgabe.",
    "Knapp am Sieg vorbei ist auch daneben.","Statistisch gesehen: peinlich."
  ];
  const CRAZY_TAGS=["weiche aus · sammle · überlebe","probier nicht zu sterben (du wirst)","100% chiptune, 0% gnade","heute schon explodiert?","reflexe verkauft? hier zurückholen","no cap, das wird mid","6 7 enjoyer welcome"];
  const INSULTS=["Schwach. Richtig schwach.","Loser-Alarm. 🚨","Das war erbärmlich, ehrlich.","Meine Oma weicht besser aus.","Git gud, sagt man da.","Talentfrei – aber niedlich.","Selbst die Bots lachen.","Setzen. Sechs.","Pixel-Versager Deluxe.","War das Absicht? Bitte sag ja.","Skill: nicht gefunden.","Eine Schande für Synthwave.","L + ratio + bozo.","skill issue tbh.","−1000 Aura, digga.","mid. einfach mid.","das war goofy ngl.","sit down, bro.","NPC-Tod erkannt.","0 rizz, 0 skill.","ratio. L. cope.","delulu warst du eh."];
  const DUMB=["bro hat einfach... ja.","skibidi 🚽","das ist lowkey mid","real ones wissen Bescheid","+50 Aura für nix","kein Cap fr fr","gönn dir, digga","sigma move 🗿","Ohio-Level erreicht","goofy ahh ausweichen","valid. einfach valid.","NPC-Verhalten erkannt","slay 💅","krass Bruder","delulu ist die solulu","W oder L?","based ngl","gyatt 😳","mach mal kein L","ist das Aura oder Lag?","6 7 😶‍🌫️","kein Plan was hier abgeht","Hä? auch egal.","das ribbelt im Hirn"];
  function gameOver(){ state=S.OVER; sfxGameOver(); duckMusic(2.4); shake=24; vibe([120,50,200]);
    spawnParticles(player.x,player.y,'#ff2e88',46,380); spawnParticles(player.x,player.y,'#19f0ff',26,260);
    const rec=score>curBest(); if(rec){ setBest(score); saveScores();
      for(let i=0;i<5;i++) pixelBurst(rand(W*0.2,W*0.8),rand(H*0.2,H*0.55),pick(['#ffe600','#ff2e88','#19f0ff','#2effc0']),8);
      setTimeout(()=>{beep(660,0.1,'square',0.3);},120); setTimeout(()=>{beep(880,0.1,'square',0.3);},260); setTimeout(()=>{beep(1175,0.18,'square',0.35);},400); }
    const earned=Math.max(0,Math.round((score/55 + nearCount*0.6 + (bossNumber-1)*30 + (wonThisRun?250:0))*chipMult()));
    meta.chips=(meta.chips||0)+earned;
    addStat('orbs',runOrbs); addStat('near',nearCount); addStat('perfect',runPerfect); addStat('bosses',runBosses); addStat('runs',1); addStat('chipsTotal',earned);
    meta.stats=meta.stats||{}; if(runMaxMult>statN('maxCombo')) meta.stats.maxCombo=runMaxMult; if(bossNumber>statN('maxBoss')) meta.stats.maxBoss=bossNumber;
    if(statN('orbs')>=1000) unlockAch('orbs1000'); if(statN('chipsTotal')>=10000) unlockAch('chips10k');
    saveMeta(); updateMenuChips();
    document.getElementById('hud').classList.add('hidden');
    finalScore.textContent=Math.round(score); finalBest.textContent=curBest(); overModeEl.textContent=daily?(t('modeDaily')+' · '+dailyLabel()):modeLabel(mode);
    chipsEarnedEl.textContent=(wonThisRun?t('clearedTag'):'')+'◈ +'+earned+'  ·  '+t('balance')+' ◈ '+(meta.chips||0);
    quipEl.textContent=pick(P('quips')); insultEl.textContent=pick(P('insults')); newrecEl.style.display=rec?'block':'none';
    setTimeout(()=>document.getElementById('over').classList.remove('hidden'),560);
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
    x.fillStyle='#fff'; x.shadowColor='#ff2e88'; x.shadowBlur=42; x.font='900 116px Orbitron, sans-serif';
    x.fillText('NEONDRIFT',540,250);
    x.shadowBlur=0; x.fillStyle='#9a86c9'; x.font='700 34px Orbitron, sans-serif';
    x.fillText(daily?(t('dailyLbl')+' · '+dailyLabel()):modeLabel(mode),540,322);
    x.fillStyle='#19f0ff'; x.shadowColor='#19f0ff'; x.shadowBlur=46; x.font='900 230px Orbitron, sans-serif';
    x.fillText(String(Math.round(score)),540,600);
    x.shadowBlur=0; x.fillStyle='#ffe600'; x.font='700 40px Orbitron, sans-serif'; x.fillText(t('pointsBig'),540,672);
    x.fillStyle='#c9b9ef'; x.font='400 36px "Space Mono", monospace'; x.fillText(t('record')+' '+curBest(),540,840);
    x.fillStyle='#ff2e88'; x.shadowColor='#ff2e88'; x.shadowBlur=20; x.font='900 52px Orbitron, sans-serif'; x.fillText(t('beatMe'),540,930);
    x.shadowBlur=0; x.fillStyle='#5b4a85'; x.font='400 30px "Space Mono", monospace'; x.fillText('hannespix.github.io/neondrift',540,1020);
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
  function openShop(){ document.getElementById('start').classList.add('hidden'); renderShop();
    document.getElementById('shop').classList.remove('hidden'); sfxUpgrade(); }
  function closeShop(){ shopResetArmed=false; const rb=document.getElementById('shopResetBtn'); if(rb) rb.textContent=t('resetAll');
    document.getElementById('shop').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden'); updateMenuChips(); }
  function renderShop(){ shopChipsEl.textContent='◈ '+fmt(meta.chips);
    if(shopHintEl) shopHintEl.textContent='dauerhaft gespeichert · immer teurer & krasser';
    shopCards.innerHTML='';
    META.forEach(m=>{ const lvl=metaLvl(m.id), maxed=lvl>=m.max, cost=maxed?0:metaCost(m,lvl), afford=(meta.chips||0)>=cost;
      const card=document.createElement('div'); card.className='ucard'+(maxed?' maxed':'');
      const btn=maxed?'<div class="cost done">MAX</div>':('<button class="cost'+(afford?'':' locked')+'">◈ '+cost+'</button>');
      card.innerHTML='<div class="ico">'+m.ico+'</div><h4>'+mName(m.id)+'</h4><p>'+mTxt(m.id)+'</p><div class="stack">'+t('level')+' '+lvl+'/'+m.max+'</div>'+btn;
      const b=card.querySelector('button.cost'); if(b) b.addEventListener('click',()=>buyMeta(m.id));
      shopCards.appendChild(card); }); }
  function buyMeta(id){ const m=META.find(x=>x.id===id); if(!m) return; const lvl=metaLvl(id);
    if(lvl>=m.max) return; const cost=metaCost(m,lvl); if((meta.chips||0)<cost){ beep(200,0.12,'square',0.2,-60); return; }
    meta.chips-=cost; meta.lvl=meta.lvl||{}; meta.lvl[id]=lvl+1; saveMeta(); sfxUpgrade(); vibe([15,20,15]); renderShop(); }
  let shopResetArmed=false;
  function shopReset(){ const b=document.getElementById('shopResetBtn');
    if(shopResetArmed){ shopResetArmed=false; meta.chips=0; meta.lvl={}; saveMeta();
      b.textContent=t('resetAll'); beep(200,0.3,'sawtooth',0.3,-120); vibe([40,30,40]); renderShop(); updateMenuChips(); }
    else { shopResetArmed=true; b.textContent=t('reallyQ'); beep(440,0.08,'square',0.2);
      setTimeout(()=>{ if(shopResetArmed){ shopResetArmed=false; b.textContent=t('resetAll'); } },4000); } }

  // ---------- Loadout (Pre-Run: Startwaffen wählen) ----------
  const loadoutSlots=()=>3+metaLvl('slot');
  function openLoadout(){ document.getElementById('start').classList.add('hidden'); renderLoadout();
    document.getElementById('loadout').classList.remove('hidden'); sfxUpgrade(); }
  function closeLoadout(){ document.getElementById('loadout').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden'); }
  function toggleLoadout(id){ if(!weaponUnlocked(id)){ closeLoadout(); openShop(); return; }  // gesperrt → ab in die Werkstatt
    meta.loadout=(meta.loadout||['blaster']).slice(); const i=meta.loadout.indexOf(id);
    if(i>=0){ if(meta.loadout.length<=1){ beep(200,0.1,'square',0.2,-60); return; } meta.loadout.splice(i,1); }
    else { if(meta.loadout.length>=loadoutSlots()){ beep(200,0.1,'square',0.2,-60); return; } meta.loadout.push(id); }
    saveMeta(); sfxPow(); vibe(12); renderLoadout(); }
  function renderLoadout(){ const slots=loadoutSlots();
    meta.loadout=(meta.loadout||['blaster']).filter(id=>WID[id]&&weaponUnlocked(id)); if(!meta.loadout.length) meta.loadout=['blaster'];
    meta.loadout=meta.loadout.slice(0,slots); saveMeta();
    const sub=document.getElementById('loadoutSub'); if(sub) sub.textContent=t('slotsLbl')+' '+meta.loadout.length+'/'+slots;
    const wrap=document.getElementById('loadoutCards'); if(!wrap) return; wrap.innerHTML='';
    WEAPONS.forEach(w=>{ const eq=meta.loadout.indexOf(w.id)>=0, lock=!weaponUnlocked(w.id);
      const card=document.createElement('div'); card.className='ucard weapon'+(eq?' equipped':'')+(lock?' locked':'');
      const tag=lock?t('lockedW'):(eq?'✓':t('freeSlot'));
      card.innerHTML=`<div class="ico">${w.ico}</div><h4>${wName(w.id)}</h4><p>${wDesc(w.id)}</p><div class="stack">${tag}</div>`;
      card.addEventListener('click',()=>toggleLoadout(w.id)); wrap.appendChild(card); });
  }
  // ---------- Arsenal-Ansicht (In-Run, über Pause: Build ansehen, Waffe ablegen) ----------
  function openArsenalView(){ if(state!==S.PAUSE) return; renderArsenalView(); document.getElementById('arsenalView').classList.remove('hidden'); sfxUpgrade(); }
  function closeArsenalView(){ document.getElementById('arsenalView').classList.add('hidden'); }
  function dropWeapon(id){ delete arsenal.w[id]; recalcArsenal(); beep(220,0.18,'sawtooth',0.3,-100); vibe([25,20]); renderArsenalView(); }
  function renderArsenalView(){ const sub=document.getElementById('arsenalViewSub'); if(sub) sub.textContent=t('slotsLbl')+' '+ownedCount()+'/'+arsenal.slots;
    const wrap=document.getElementById('arsenalCards'); if(!wrap) return; wrap.innerHTML='';
    ownedW().forEach(id=>{ const a=arsenal.w[id], paths=[]; if(a.f1)paths.push(pName(a.f1)); if(a.f2)paths.push(pName(a.f2));
      const card=document.createElement('div'); card.className='ucard weapon';
      card.innerHTML=`<div class="ico">${WID[id].ico}</div><h4>${wName(id)}</h4><p>${paths.length?paths.join(' · '):wDesc(id)}</p><div class="stack">Lv ${a.lvl}/3</div><button class="cost drop">✕ ${t('drop')}</button>`;
      card.querySelector('button.drop').addEventListener('click',e=>{ e.stopPropagation(); dropWeapon(id); }); wrap.appendChild(card); });
    for(let i=ownedCount();i<arsenal.slots;i++){ const card=document.createElement('div'); card.className='ucard slotEmpty'; card.innerHTML=`<div class="ico">＋</div><p>${t('freeSlot')}</p>`; wrap.appendChild(card); }
    const sd=document.getElementById('arsenalSyn'); if(sd){ const act=SYNERGIES.filter(s=>syn[s.id]);
      sd.innerHTML='<h4>'+t('synTitle')+'</h4>'+(act.length?act.map(s=>`<div class="synrow">${s.ico} <b>${synName(s.id)}</b> — ${synDesc(s.id)}</div>`).join(''):('<div class="synrow dim">'+t('noSyn')+'</div>')); }
  }
  // In-Run HUD: Waffenleiste mit Level-Pips + Synergie-Badges
  function drawArsenalHud(){ const ids=ownedW(); if(!ids.length) return;
    const y=H-24; let x=14; ctx.textAlign='left'; ctx.textBaseline='middle';
    for(const id of ids){ ctx.font='17px Space Mono, monospace'; ctx.shadowBlur=8; ctx.shadowColor=WID[id].col; ctx.fillStyle='#fff'; ctx.fillText(WID[id].ico,x,y);
      ctx.shadowBlur=0; const lv=arsenal.w[id].lvl; for(let i=0;i<3;i++){ ctx.fillStyle=i<lv?WID[id].col:'rgba(255,255,255,0.16)'; ctx.fillRect(x+1+i*6,y+12,4,3); }
      x+=30; }
    const act=SYNERGIES.filter(s=>syn[s.id]); if(act.length){ x+=4; ctx.font='14px Space Mono, monospace'; for(const s of act){ ctx.shadowBlur=9; ctx.shadowColor='#ff2e88'; ctx.fillStyle='#ff7ab8'; ctx.fillText(s.ico,x,y-1); x+=20; } }
    ctx.shadowBlur=0; }
  // ---------- Einstellungen ----------
  function openSettings(){ document.getElementById('start').classList.add('hidden'); renderSettings();
    document.getElementById('settings').classList.remove('hidden'); beep(660,0.06,'square',0.2); }
  function closeSettings(){ document.getElementById('settings').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden'); }
  const OPTLBL={shake:'optShake',fx:'optFx',curses:'optCurses',guns:'optGuns',lang:'optLang'};
  function renderSettings(){ document.querySelectorAll('#optRows .optrow').forEach(row=>{
    const k=row.dataset.opt; let v;
    if(k==='lang') v=lang.toUpperCase();
    else if(k==='shake') v=(opt.shake===0?t('off'):(opt.shake<1?t('reduced'):t('on')));
    else v=(opt[k]?t('on'):t('off'));
    row.innerHTML=t(OPTLBL[k])+' · <b>'+v+'</b>'; }); }
  function cycleOpt(k){
    if(k==='lang'){ const order=['de','en','fr']; lang=order[(order.indexOf(lang)+1)%3]; saveLang(); applyI18n(); beep(740,0.06,'square',0.2); return; }
    if(k==='shake') opt.shake=(opt.shake>=1?0.4:(opt.shake>0?0:1));
    else opt[k]=!opt[k];
    saveOpt(); renderSettings(); beep(opt[k]===false?330:740,0.06,'square',0.2); }
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
  function openSkins(){ document.getElementById('start').classList.add('hidden'); renderSkins(); document.getElementById('skins').classList.remove('hidden'); beep(660,0.06,'square',0.2); }
  function closeSkins(){ document.getElementById('skins').classList.add('hidden'); document.getElementById('start').classList.remove('hidden'); }
  function selectSkin(id){ meta.skin=id; saveMeta(); shipSig=''; beep(740,0.06,'square',0.2); renderSkins(); }
  function buySkin(id){ const s=SKINS.find(x=>x.id===id); if(!s||!s.cost) return; if((meta.chips||0)<s.cost){ beep(200,0.12,'square',0.2,-60); return; }
    meta.chips-=s.cost; unlockSkin(id); meta.skin=id; saveMeta(); shipSig=''; sfxUpgrade(); vibe([15,20,15]); renderSkins(); updateMenuChips(); }
  function renderSkins(){ const ch=document.getElementById('skinChips'); if(ch) ch.textContent='◈ '+fmt(meta.chips);
    const wrap=document.getElementById('skinCards'); if(!wrap) return; wrap.innerHTML='';
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
      wrap.appendChild(card); }); }
  function applyI18n(){ try{ document.documentElement.lang=lang;
    const set=(id,v,html)=>{ const e=document.getElementById(id); if(e){ if(html) e.innerHTML=v; else e.textContent=v; } };
    const setSel=(sel,v,html)=>{ const e=document.querySelector(sel); if(e){ if(html) e.innerHTML=v; else e.textContent=v; } };
    set('titleTag',t('tag')); set('dailyBtn',t('daily')); set('shopLbl','🛒 '+t('workshop')); set('settingsBtn',t('settings'));
    setSel('.how',t('how'),true); set('installBtn',t('install')); set('iosHint',t('ios'),true);
    document.querySelectorAll('.mode').forEach(c=>{ const m=c.dataset.mode==='hardcore'?'hard':c.dataset.mode;
      const h=c.querySelector('h3'),p=c.querySelector('p'); if(h)h.textContent=t('m_'+m); if(p)p.textContent=t('m_'+m+'D'); });
    setSel('#pause .utitle',t('pause')); set('resumeBtn',t('resume')); set('pauseMenuBtn',t('mainmenu')); set('arsenalViewBtn',t('arsenalBtn'));
    set('loadoutBtn',t('loadoutBtn')); setSel('#loadout .utitle',t('loadoutTitle')); set('loadoutBackBtn',t('back'));
    setSel('#arsenalView .utitle',t('arsenalTitle')); set('arsenalBackBtn',t('back'));
    setSel('#upgrade .utitle',t('chooseUp'));
    setSel('#shop .utitle',t('workshop')); set('balLbl',t('balance')); set('shopBackBtn',t('back')); set('shopResetBtn',t('resetAll'));
    setSel('#settings .utitle',t('setTitle')); set('setHint',t('tapToggle')); set('settingsBackBtn',t('back'));
    set('achBtn',t('achBtn')); setSel('#ach .utitle',t('achTitle')); set('achBackBtn',t('back'));
    set('skinBtn',t('skinBtn')); setSel('#skins .utitle',t('skinTitle')); set('skinBalLbl',t('balance')); set('skinBackBtn',t('back'));
    setSel('#over .gover',t('crash')); set('newrec',t('newRec')); set('againBtn',t('again')); set('shareBtn',t('share')); set('menuBtn',t('menu'));
    const lbls=document.querySelectorAll('#over .scorebox .lbl'); if(lbls[0])lbls[0].textContent=t('points'); if(lbls[1])lbls[1].textContent=t('record');
    if(typeof renderSettings==='function') renderSettings();
  }catch(e){} }

  // ---------- Loop ----------
  function loop(now){ let dt=(now-lastT)/1000; lastT=now; if(dt>0.05)dt=0.05;
    if(state===S.PLAY) update(dt);
    else { elapsed=(elapsed||0)+dt; for(const s of stars){s.y+=(20+s.z*40)*dt;if(s.y>H){s.y=-2;s.x=Math.random()*W;}}
      if(particles)for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.life-=p.decay;if(p.life<=0)particles.splice(i,1);}
      shake=Math.max(0,(shake||0)-dt*60); }
    if(achToasts.length){ achToasts[0].t-=dt; if(achToasts[0].t<=0) achToasts.shift(); }
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
  const scoreEl=document.getElementById('score'),comboEl=document.getElementById('combo'),bestHud=document.getElementById('best-hud'),
        finalScore=document.getElementById('finalScore'),finalBest=document.getElementById('finalBest'),quipEl=document.getElementById('quip'),
        newrecEl=document.getElementById('newrec'),modeNameEl=document.getElementById('modeName'),overModeEl=document.getElementById('overMode'),
        zenExitBtn=document.getElementById('zenExit'),upgradeCards=document.getElementById('upgradeCards'),upgradeSub=document.getElementById('upgradeSub'),
        titleTag=document.getElementById('titleTag'),insultEl=document.getElementById('insult'),
        pauseSub=document.getElementById('pauseSub'),
        comboBarEl=document.getElementById('comboBar'),comboFillEl=comboBarEl.querySelector('i'),
        menuChipsEl=document.getElementById('menuChips'),shopChipsEl=document.getElementById('shopChips'),shopHintEl=document.getElementById('shopHint'),
        shopCards=document.getElementById('shopCards'),chipsEarnedEl=document.getElementById('chipsEarned');
  document.querySelectorAll('.mode').forEach(c=>c.addEventListener('click',()=>startGame(c.dataset.mode)));
  document.getElementById('dailyBtn').addEventListener('click',()=>startGame('daily'));
  document.getElementById('shopBtn').addEventListener('click',openShop);
  document.getElementById('shopBackBtn').addEventListener('click',closeShop);
  document.getElementById('shopCloseBtn').addEventListener('click',closeShop);
  document.getElementById('shopResetBtn').addEventListener('click',shopReset);
  document.getElementById('achBtn').addEventListener('click',openAch);
  document.getElementById('achBackBtn').addEventListener('click',closeAch);
  document.getElementById('achCloseBtn').addEventListener('click',closeAch);
  document.getElementById('skinBtn').addEventListener('click',openSkins);
  document.getElementById('skinBackBtn').addEventListener('click',closeSkins);
  document.getElementById('skinCloseBtn').addEventListener('click',closeSkins);
  document.getElementById('settingsBtn').addEventListener('click',openSettings);
  document.getElementById('settingsBackBtn').addEventListener('click',closeSettings);
  document.getElementById('settingsCloseBtn').addEventListener('click',closeSettings);
  document.querySelectorAll('#optRows .optrow').forEach(row=>row.addEventListener('click',()=>cycleOpt(row.dataset.opt)));
  document.getElementById('againBtn').addEventListener('click',()=>startGame());
  document.getElementById('menuBtn').addEventListener('click',toMenu);
  document.getElementById('shareBtn').addEventListener('click',shareScore);
  applyI18n(); updateMenuChips();
  zenExitBtn.addEventListener('click',pauseGame);
  document.getElementById('resumeBtn').addEventListener('click',resumeGame);
  document.getElementById('pauseMenuBtn').addEventListener('click',toMenu);
  const lb=document.getElementById('loadoutBtn'); if(lb) lb.addEventListener('click',openLoadout);
  const lbk=document.getElementById('loadoutBackBtn'); if(lbk) lbk.addEventListener('click',closeLoadout);
  const lbc=document.getElementById('loadoutCloseBtn'); if(lbc) lbc.addEventListener('click',closeLoadout);
  const av=document.getElementById('arsenalViewBtn'); if(av) av.addEventListener('click',openArsenalView);
  const avc=document.getElementById('arsenalCloseBtn'); if(avc) avc.addEventListener('click',closeArsenalView);
  const avb=document.getElementById('arsenalBackBtn'); if(avb) avb.addEventListener('click',closeArsenalView);
  const muteBtn=document.getElementById('mute');
  muteBtn.addEventListener('click',()=>{ muted=!muted; muteBtn.textContent=muted?'🔇':'🔊';
    if(masterGain) masterGain.gain.value=muted?0:0.9; if(!muted){ unlockAudio(); } });
  let lastKey='';
  const isOpen=id=>{ const e=document.getElementById(id); return e&&!e.classList.contains('hidden'); };
  window.addEventListener('keydown',e=>{ if(e.code==='Escape'){
      if(isOpen('arsenalView')){ closeArsenalView(); return; }
      if(isOpen('loadout')){ closeLoadout(); return; }
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
  setInterval(()=>{ if(state===S.MENU && musicOn){ curSong=(curSong+1)%SONGS.length; sfxRiser(); titleTag.textContent='♪ jetzt: '+SONGS[curSong].name; } },12000);

  particles=[]; floaters=[]; obstacles=[]; orbs=[]; powerups=[]; lasers=[]; bullets=[]; ebullets=[]; boss=null; gems=[];
  multiplier=1; combo=0; nearGlow=0; flash=0; shake=0; bossActive=false; elapsed=0;
  effects={slowmo:0,magnet:0,double:0}; shields=0; invuln=0;
  requestAnimationFrame(loop);
})();

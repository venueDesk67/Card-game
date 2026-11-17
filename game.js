const CARD_DB = window.EQUINOX_CARDS;
const $ = id => document.getElementById(id);
const state = {
  turn:1, current:"player", phase:"main", playerLP:4000, aiLP:4000, normalSummoned:false,
  player:{faction:"Aether",deck:[],hand:[],monsters:Array(5).fill(null),backrow:Array(5).fill(null),grave:[]},
  ai:{faction:"Umbra",deck:[],hand:[],monsters:Array(5).fill(null),backrow:Array(5).fill(null),grave:[]},
  selectedHand:null, selectedMonster:null, attackMode:false, tributes:[], tributedThisTurn:false,
  protections:{player:false,ai:false}, ended:false, busy:false, log:[]
};
const icons={Aether:"✦",Umbra:"☠"};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=c=>({...c});
function log(msg){state.log.unshift(msg);state.log=state.log.slice(0,35);$("log").innerHTML=state.log.map(x=>`<div>› ${escapeHTML(x)}</div>`).join("")}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function owner(){return state.current==="player"?state.player:state.ai}
function enemy(){return state.current==="player"?state.ai:state.player}
function setAction(title,msg){$("actionTitle").textContent=title;$("actionText").textContent=msg}
function init(){
  state.turn=1;state.current="player";state.phase="main";state.playerLP=state.aiLP=4000;
  for(const side of ["player","ai"]){
    const faction=side==="player"?"Aether":"Umbra";
    const d=CARD_DB.filter(c=>c.faction===faction).map(clone);
    state[side]={faction,deck:shuffle(d),hand:[],monsters:Array(5).fill(null),backrow:Array(5).fill(null),grave:[]};
    for(let i=0;i<5;i++) draw(side,false);
  }
  state.selectedHand=null;state.selectedMonster=null;state.attackMode=false;state.tributes=[];state.tributedThisTurn=false;state.normalSummoned=false;state.protections={player:false,ai:false};state.ended=false;state.log=[];
  log("The duel begins. Aether moves first.");render();setAction("Your move","Select a card from your hand to summon, set or activate it.");
}
function draw(side,announce=true){
  const p=state[side];if(!p.deck.length){finish(side==="player"?"ai":"player","has no cards left to draw");return}
  p.hand.push(p.deck.pop());if(announce)log((side==="player"?"You":"Umbra") +" draw a card.");
}
function render(){
  $("turnNumber").textContent=state.turn;$("phaseLabel").textContent=(state.current==="player"?"Player":"CPU")+" "+state.phase+" phase";
  $("playerLP").textContent=state.playerLP;$("aiLP").textContent=state.aiLP;
  $("handTitle").textContent="Aether cards";$("handCount").textContent=state.player.hand.length+" cards";
  $("playerDeckCount").textContent="DECK "+state.player.deck.length;$("aiDeckCount").textContent="DECK "+state.ai.deck.length;
  $("playerGraveCount").textContent="GRAVEYARD "+state.player.grave.length;$("aiGraveCount").textContent="GRAVEYARD "+state.ai.grave.length;
  renderZones("player");renderZones("ai");renderHand();
  $("endTurn").disabled=state.current!=="player"||state.ended;
  $("attackMode").disabled=state.current!=="player"||!state.selectedMonster||state.player.monsters[state.selectedMonster]?.position!=="attack";
  $("defMode").disabled=state.current!=="player"||!state.selectedMonster;
  const selected=state.selectedMonster===null?null:state.player.monsters[state.selectedMonster];
  $("useEffect").disabled=state.current!=="player"||!selected||!["seraph","reaper","malgrath","elysius"].includes(selected.effectKey)||selected.used;
}
function renderZones(side){
  const p=state[side],prefix=side==="player"?"player":"ai";
  ["monsters","backrow"].forEach(kind=>{
    const el=$(prefix+(kind==="monsters"?"Monsters":"Backrow"));el.innerHTML="";
    p[kind].forEach((card,i)=>{
      const z=document.createElement("div");z.className="zone"+(card?" occupied":"")+(side==="player"&&kind==="monsters"&&state.selectedMonster===i?" selected":"");
      if(card){
        z.innerHTML=side==="ai"&&kind==="backrow"?'<div class="card-back">✦</div>':`<div class="card-mini"><span class="mini-faction">${card.faction.toUpperCase()} · ${card.level?"LV "+card.level:card.type.toUpperCase()}</span><span class="mini-name">${escapeHTML(card.name)}</span><span class="mini-stats">${kind==="monsters"?(card.position==="def"?"DEF ":"ATK ")+(card.position==="def"?currentDef(card):currentAtk(card)):"SET"}</span></div>`;
        if(side==="player"&&kind==="monsters")z.onclick=()=>{if(state.attackMode&&!state.ai.monsters.some(Boolean))attackDirect();else selectMonster(i)};
        else if(side==="player"&&kind==="backrow")z.onclick=()=>activateSet(i);
        else if(side==="ai"&&kind==="monsters"&&state.current==="player"&&state.attackMode)z.onclick=()=>attack(i);
      }else{
        z.textContent=kind==="monsters"?"MONSTER ZONE":"SPELL / TRAP";
        if(side==="player"&&kind==="monsters")z.onclick=()=>summonInto(i);
      }
      el.appendChild(z);
    });
  });
}
function renderHand(){
  const el=$("hand");el.innerHTML="";
  state.player.hand.forEach((c,i)=>{
    const b=document.createElement("button");b.className="card "+(c.faction==="Umbra"?"umbra ":"")+(c.type==="Spell"?"spell ":c.type==="Trap"?"trap ":"")+(state.selectedHand===i?"selected":"");
    const art=c.type==="Monster"?(c.faction==="Aether"?"✧":"♨"):(c.type==="Spell"?"✦":"◈");
    b.innerHTML=`<span class="card-name">${escapeHTML(c.name)}</span><span class="card-art">${art}</span><span class="card-meta">${c.type==="Monster"?"LV "+c.level+" · "+c.atk+"/"+c.def:c.type.toUpperCase()}</span><span class="card-effect">${escapeHTML(c.effect)}</span>`;
    b.onclick=()=>selectHand(i);el.appendChild(b);
  });
}
function selectHand(i){
  if(state.current!=="player"||state.ended)return;
  state.selectedHand=i;state.selectedMonster=null;state.attackMode=false;
  const c=state.player.hand[i];
  if(c.type==="Monster") {
    setAction(c.name,`Level ${c.level} · ATK ${c.atk} / DEF ${c.def}. ${summonCost(c)}. Select an empty monster zone.`);
  } else if(c.type==="Spell") {
    activateSpell(i);
    state.selectedHand=null;
  } else {
    setTrap(i);
    state.selectedHand=null;
  }
  render();
}
function summonCost(c){const n=c.level>=9?3:c.level>=7?2:c.level>=5?1:0;return n?`Requires ${n} Tribute${n>1?"s":""}.`:"Can be Normal Summoned without Tributes."}
function selectMonster(i){if(state.current!=="player"||state.ended)return;state.selectedMonster=i;state.selectedHand=null;state.attackMode=false;const c=state.player.monsters[i];setAction(c.name,`Selected in ${c.position.toUpperCase()} Position. Use Attack to declare an attack, or Change position.`);render()}
function summonInto(zone){
  if(state.current!=="player"||state.selectedHand===null)return;
  const c=state.player.hand[state.selectedHand];if(!c||c.type!=="Monster"||state.player.monsters[zone])return;
  const cost=c.level>=9?3:c.level>=7?2:c.level>=5?1:0;
  const occupied=state.player.monsters.filter(Boolean);
  if(occupied.length<cost){setAction("Not enough Tributes",`This summon needs ${cost} monsters. You control ${occupied.length}.`);return}
  if(state.normalSummoned){setAction("Summon used","You can Normal Summon only once per turn.");return}
  if(cost){chooseTributes(c,zone,cost);return}
  askPosition(c,zone,[]);
}
function chooseTributes(card,zone,cost){
  const content=document.createElement("div");content.innerHTML=`<h2>Tribute Summon</h2><p>Select ${cost} monster${cost>1?"s":""} to sacrifice for <b>${escapeHTML(card.name)}</b>. These monsters go to your Graveyard.</p><div class="choice-list" id="tributeChoices"></div>`;
  const list=content.querySelector("#tributeChoices");
  state.player.monsters.forEach((m,i)=>{if(!m)return;const b=document.createElement("button");b.textContent=`${m.name} · LV ${m.level} · ${m.atk} ATK`;b.onclick=()=>{if(state.tributes.includes(i))state.tributes=state.tributes.filter(x=>x!==i);else if(state.tributes.length<cost)state.tributes.push(i);b.classList.toggle("selected");b.textContent=(state.tributes.includes(i)?"✓ ":"")+`${m.name} · LV ${m.level} · ${m.atk} ATK`;ok.disabled=state.tributes.length!==cost};list.appendChild(b)});
  const ok=document.createElement("button");ok.className="primary";ok.textContent="Confirm Tributes";ok.disabled=true;ok.onclick=()=>{const chosen=[...state.tributes];state.tributes=[];closeModal();askPosition(card,zone,chosen)};content.appendChild(ok);showModal(content);
}
function askPosition(card,zone,tributes){
  const content=document.createElement("div");content.innerHTML=`<h2>Summon ${escapeHTML(card.name)}</h2><p>Choose its battle position.</p><div class="choice-row"><button class="primary" id="atkChoice">Attack Position</button><button class="secondary" id="defChoice">Defence Position</button></div>`;
  content.querySelector("#atkChoice").onclick=()=>{closeModal();summon(card,zone,tributes,"attack")};
  content.querySelector("#defChoice").onclick=()=>{closeModal();summon(card,zone,tributes,"def")};showModal(content);
}
function summon(card,zone,tributes,position,side="player"){
  const p=state[side],idx=p.hand.findIndex(c=>c.id===card.id);
  if(idx<0||p.monsters[zone])return;
  p.hand.splice(idx,1);
  const sacrificed=[];
  tributes.sort((a,b)=>b-a).forEach(i=>{const m=p.monsters[i];if(m){sacrificed.push(m);p.grave.push(m);p.monsters[i]=null}});
  p.monsters[zone]={...card,position,attacked:false,bonus:0,defBonus:0,used:false,tributeSummon:tributes.length>0};
  if(side==="player"){state.normalSummoned=true;state.tributedThisTurn=tributes.length>0;state.selectedHand=null}
  log((side==="player"?"You summon ":"Umbra summons ")+card.name+(tributes.length?" by Tribute":"")+".");
  sacrificed.forEach(m=>onTributed(m,side,card));
  onSummoned(p.monsters[zone],side,tributes.length>0);
  render();
}
function onTributed(m,side,summoned){if(m.effectKey==="dawn"&&summoned.faction==="Aether"){draw(side);log("Dawn Initiate draws a card.");}if(m.effectKey==="acolyte"&&summoned.faction==="Umbra"){damage(side==="player"?"ai":"player",300);log("Cursed Acolyte deals 300 damage.");}}
function onSummoned(m,side,tribute){
  if(m.effectKey==="priestess"){const p=state[side],idx=p.grave.findIndex(x=>x.faction==="Aether"&&x.type==="Monster"&&x.level<=3);if(idx>=0){const [x]=p.grave.splice(idx,1);p.hand.push(x);log("Halo Priestess returns "+x.name+" to hand.");}}
  if(m.effectKey==="varkos"&&tribute){m.bonus+=500;log("Varkos gains 500 ATK from the Tribute Summon.");}
  if(m.effectKey==="astrael"&&tribute){const other=side==="player"?"ai":"player";const target=state[other].monsters.findIndex(Boolean);if(target>=0){destroyMonster(other,target,"Astrael's Divine Summon");}}
  if(m.effectKey==="zarakiel"&&tribute){damage(side==="player"?"ai":"player",800);log("Zarakiel deals 800 damage.");}
}
function currentAtk(m){let v=m.atk+(m.bonus||0);if(m.effectKey==="valtherion"&&state[m.faction==="Aether"?"player":"ai"].monsters.filter(Boolean).length>1)v+=300;if(m.effectKey==="hellhound"&&state[m.faction==="Aether"?"player":"ai"].monsters.filter(Boolean).length>1)v+=300;return v}
function currentDef(m){return m.def+(m.defBonus||0)}
function activateSpell(i,side="player"){
  const p=state[side],c=p.hand[i];if(!c||c.type!=="Spell")return;
  const targetOwn=p.monsters.findIndex(Boolean),other=side==="player"?"ai":"player",targetOpp=state[other].monsters.findIndex(Boolean);
  const needsOwn=["blessing","pact"].includes(c.effectKey),needsOpp=["curse"].includes(c.effectKey),needsGrave=["restoration","abyssal"].includes(c.effectKey);
  if(needsOwn&&targetOwn<0){log("No friendly monster to target.");return}
  if(needsOpp&&targetOpp<0){log("No opposing monster to target.");return}
  if(needsGrave&&!p.grave.some(x=>x.type==="Monster"&&(c.effectKey!=="abyssal"||x.faction==="Umbra"))){log("No valid monster in your Graveyard.");return}
  if(["judgment","cataclysm"].includes(c.effectKey)&&!state[other].backrow.some(Boolean)){log("No opposing Spell or Trap to destroy.");return}
  if(c.effectKey==="soulharvest"&&!state.tributedThisTurn){log("Soul Harvest requires a Tribute this turn.");return}
  p.hand.splice(i,1);p.grave.push(c);log((side==="player"?"You activate ":"Umbra activates ")+c.name+".");
  switch(c.effectKey){
    case"blessing":case"pact":p.monsters[targetOwn].bonus+=500;break;
    case"restoration":case"abyssal":{const idx=p.grave.findIndex(x=>x.type==="Monster"&&(c.effectKey!=="abyssal"||x.faction==="Umbra"));if(idx>=0){const [x]=p.grave.splice(idx,1);p.hand.push(x);log(x.name+" returns to hand.");}break}
    case"draw":draw(side);break;
    case"barrier":state.protections[side]=true;break;
    case"judgment":case"cataclysm":{const idx=state[other].backrow.findIndex(Boolean);if(idx>=0){state[other].grave.push(state[other].backrow[idx]);state[other].backrow[idx]=null;log("An opposing back-row card is destroyed.");}break}
    case"soulharvest":draw(side);break;
    case"curse":state[other].monsters[targetOpp].bonus-=500;break;
  }
  render();
}
function setTrap(i,side="player"){
  const p=state[side],c=p.hand[i],slot=p.backrow.findIndex(x=>!x);if(!c||c.type!=="Trap"||slot<0)return;
  p.hand.splice(i,1);p.backrow[slot]={...c,setTurn:state.turn};log((side==="player"?"You set ":"Umbra sets ")+c.name+" face-down.");render();
}
function activateSet(i){
  const c=state.player.backrow[i];if(!c)return;setAction(c.name,"Set cards activate automatically when their trigger condition is met.");
}
function triggerTrap(side,key,attacker,attackerSide){
  const p=state[side],idx=p.backrow.findIndex(c=>c&&c.effectKey===key&&(c.setTurn<state.turn||(side==="player"&&state.current==="ai"&&c.setTurn===state.turn)));if(idx<0)return false;
  const c=p.backrow.splice(idx,1)[0];p.grave.push(c);log(c.name+" activates!");
  if(key==="intervention"){attacker.tempPenalty=(attacker.tempPenalty||0)+1000;return false}
  if(key==="retribution"&&currentAtk(attacker)<=1500){destroyMonster(attackerSide,state[attackerSide].monsters.indexOf(attacker),"Divine Retribution");return true}
  if(key==="hellfire"){damage(attackerSide,500);return false}
  if(key==="chains"){attacker.cancelAttack=true;return true}
  if(key==="reversal"){attacker.negated=true;return false}
  if(key==="rebirth"){const target=p.grave.findIndex(m=>m.type==="Monster"&&m.faction==="Umbra"&&m.level<=4);const empty=p.monsters.findIndex(x=>!x);if(target>=0&&empty>=0){const [m]=p.grave.splice(target,1);p.monsters[empty]={...m,position:"attack",attacked:false,bonus:0};log("Infernal Rebirth revives "+m.name+".")}return false}
  return false;
}
function attackDirect(){if(state.selectedMonster===null)return;attack(-1)}
function attack(i){
  if(state.current!=="player"||state.ended)return;const attacker=state.player.monsters[state.selectedMonster];if(!attacker||attacker.attacked||attacker.position!=="attack")return;
  const target=i>=0?state.ai.monsters[i]:null;
  if(state.ai.monsters.some(Boolean)&&!target){setAction("Choose a target","You must attack a monster while your opponent controls one.");return}
  if(triggerTrap("ai","chains",attacker,"player")){attacker.attacked=true;render();return}
  triggerTrap("ai","hellfire",attacker,"player");triggerTrap("ai","intervention",attacker,"player");
  if(attacker.cancelAttack){attacker.cancelAttack=false;attacker.attacked=true;render();return}
  const atk=currentAtk(attacker)-(attacker.tempPenalty||0);attacker.tempPenalty=0;
  if(!target){damage("ai",atk);log(attacker.name+" attacks directly for "+atk+".")}
  else if(target.position==="def"){
    const def=currentDef(target);if(atk>def){destroyMonster("ai",i,attacker.name);log("Defence monster destroyed.");}else if(atk<def){damage("player",def-atk);log("Your attack fails. You take "+(def-atk)+" damage.");}
  }else{
    const defAtk=currentAtk(target);if(atk>defAtk){destroyMonster("ai",i,attacker.name);damage("ai",atk-defAtk);}else if(atk<defAtk){destroyMonster("player",state.selectedMonster, target.name);damage("player",defAtk-atk);}else{destroyMonster("ai",i,attacker.name);destroyMonster("player",state.selectedMonster,target.name);}
  }
  attacker.attacked=true;state.selectedMonster=null;state.attackMode=false;render();checkWinner();
}
function destroyMonster(side,i,reason){
  const p=state[side],m=p.monsters[i];if(!m)return;
  if(m.protectedByElysius){m.protectedByElysius=false;log(m.name+" is protected by Elysius.");return}
  p.monsters[i]=null;p.grave.push(m);log(m.name+" is destroyed ("+reason+").");
  if(m.effectKey==="imp"&&side==="ai")damage("player",300);
  if(side==="ai"&&m.faction==="Umbra")triggerTrap("player","rebirth",m,"ai");
}
function damage(side,n){if(side==="player"){if(state.protections.player){state.protections.player=false;log("Sacred Barrier prevents the damage.");return}state.playerLP=Math.max(0,state.playerLP-n)}else{if(state.protections.ai){state.protections.ai=false;log("Sacred Barrier prevents the damage.");return}state.aiLP=Math.max(0,state.aiLP-n)}render();checkWinner()}
function checkWinner(){if(state.playerLP<=0)finish("ai","reduced your Life Points to zero");if(state.aiLP<=0)finish("player","reduced Umbra's Life Points to zero")}
function finish(winner,why){if(state.ended)return;state.ended=true;setAction(winner==="player"?"VICTORY":"DEFEAT",winner==="player"?"You have restored the balance.":"The infernal legion has prevailed.");showModal(`<h2>${winner==="player"?"AETHER PREVAILS":"UMBRA PREVAILS"}</h2><p>${winner==="player"?"You win!":"You lose."} The duel ended because a player ${why}.</p><div class="choice-row"><button class="primary" id="again">Play again</button></div>`);setTimeout(()=>{const b=$("again");if(b)b.onclick=()=>{closeModal();init()}},0);render()}
function useMonsterEffect(){
  if(state.current!=="player"||state.selectedMonster===null)return;
  const m=state.player.monsters[state.selectedMonster];if(!m||m.used)return;
  const target=state.ai.monsters.findIndex(Boolean);
  if(m.effectKey==="seraph"){m.defBonus=(m.defBonus||0)+300;m.used=true;log("Seraph Guardian gains 300 DEF until your next turn.");}
  else if(m.effectKey==="reaper"){if(target<0){log("There is no opposing monster to weaken.");return;}state.ai.monsters[target].bonus=(state.ai.monsters[target].bonus||0)-300;m.used=true;log("Chaos Reaper reduces "+state.ai.monsters[target].name+"'s ATK by 300 this turn.");}
  else if(m.effectKey==="malgrath"){const idx=state.ai.monsters.findIndex(x=>x&&currentAtk(x)<=2000);if(idx<0){log("Malgrath has no valid target with 2000 or less ATK.");return;}destroyMonster("ai",idx,"Malgrath's effect");m.used=true;}
  else if(m.effectKey==="elysius"){const idx=state.player.monsters.findIndex((x,i)=>x&&i!==state.selectedMonster);if(idx<0){log("Elysius needs another Aether monster to protect.");return;}state.player.monsters[idx].protectedByElysius=true;m.used=true;log("Elysius protects "+state.player.monsters[idx].name+" from the next destruction.");}
  render();
}
function changePosition(){if(state.selectedMonster===null)return;const m=state.player.monsters[state.selectedMonster];if(!m||m.position==="def"||m.attacked)return;m.position="def";m.attacked=true;log(m.name+" changes to Defence Position.");state.selectedMonster=null;render()}
function endTurn(){
  if(state.current!=="player"||state.ended)return;
  state.selectedHand=null;state.selectedMonster=null;state.attackMode=false;state.current="ai";state.phase="main";render();setAction("Umbra's turn","The infernal legion is taking its turn.");setTimeout(aiTurn,650);
}
function aiTurn(){
  if(state.ended)return;draw("ai");state.normalSummoned=false;state.tributedThisTurn=false;
  // Simple AI: summon the strongest affordable monster, using the minimum number of Tributes.
  let monsters=state.ai.hand.filter(c=>c.type==="Monster").sort((a,b)=>b.atk-a.atk);
  let chosen=null,cost=0;
  for(const c of monsters){const n=c.level>=9?3:c.level>=7?2:c.level>=5?1:0;if(state.ai.monsters.filter(Boolean).length>=n){chosen=c;cost=n;break}}
  if(chosen){const zone=state.ai.monsters.findIndex(x=>!x);let trib=[];if(cost){trib=state.ai.monsters.map((m,i)=>m?i:-1).filter(i=>i>=0).slice(0,cost)}if(zone>=0)summon(chosen,zone,trib,"attack","ai")}
  // AI activates one useful spell if available.
  const spellIdx=state.ai.hand.findIndex(c=>c.type==="Spell"&&(["draw","blessing","pact","soulharvest"].includes(c.effectKey)));
  if(spellIdx>=0)activateSpell(spellIdx,"ai");
  const trapIdx=state.ai.hand.findIndex(c=>c.type==="Trap");if(trapIdx>=0)setTrap(trapIdx,"ai");
  // AI attacks with every eligible monster.
  for(let i=0;i<5;i++){const m=state.ai.monsters[i];if(!m||m.position!=="attack"||m.attacked||state.ended)continue;const targetIdx=state.player.monsters.findIndex(Boolean);const target=targetIdx>=0?state.player.monsters[targetIdx]:null;
    if(triggerTrap("player","chains",m,"ai")){m.attacked=true;continue}
    triggerTrap("player","hellfire",m,"ai");triggerTrap("player","intervention",m,"ai");
    if(m.cancelAttack){m.cancelAttack=false;m.attacked=true;continue}
    const atk=currentAtk(m)-(m.tempPenalty||0);m.tempPenalty=0;
    if(!target)damage("player",atk);
    else if(target.position==="def"){const d=currentDef(target);if(atk>d)destroyMonster("player",targetIdx,m.name);else if(atk<d)damage("ai",d-atk)}
    else{const d=currentAtk(target);if(atk>d){destroyMonster("player",targetIdx,m.name);damage("player",atk-d)}else if(atk<d){destroyMonster("ai",i,target.name);damage("ai",d-atk)}else{destroyMonster("player",targetIdx,m.name);destroyMonster("ai",i,target.name)}}
    m.attacked=true;
  }
  if(state.ended)return;
  state.current="player";state.turn++;state.phase="main";state.normalSummoned=false;state.tributedThisTurn=false;state.protections.player=false;state.protections.ai=false;
  state.player.monsters.forEach(m=>{if(m){m.attacked=false;m.bonus=0;m.defBonus=0;m.used=false}});
  state.ai.monsters.forEach(m=>{if(m){m.attacked=false;m.bonus=0;m.defBonus=0;m.used=false}});
  draw("player");log("Your turn begins.");setAction("Your move","Draw complete. Summon, activate cards and battle.");render();
}
function showModal(content){$("modalContent").innerHTML="";if(typeof content==="string")$("modalContent").innerHTML=content;else $("modalContent").appendChild(content);$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
$("newGame").onclick=()=>{showModal('<h2>Start a new duel?</h2><p>The current duel will be lost.</p><div class="choice-row"><button class="primary" id="confirmNew">Start new duel</button><button class="secondary" id="keepGame">Keep playing</button></div>');$("confirmNew").onclick=()=>{closeModal();init()};$("keepGame").onclick=closeModal};
$("rulesBtn").onclick=()=>showModal('<h2>Quick rules</h2><ul><li>Both players begin with 4000 LP and draw 5 cards.</li><li>The player goes first and does not draw on the first turn after the opening hand.</li><li>Draw 1 card at the start of each later turn.</li><li>One Normal Summon per turn. Levels 1–4 need no Tribute; 5–6 need 1; 7–8 need 2; 9–10 need 3.</li><li>Choose Attack or Defence Position when summoning. Monsters in Defence use DEF when attacked.</li><li>Set Traps face-down. They trigger automatically when their conditions are met, beginning the turn after they were set.</li><li>Reduce the opponent to 0 LP to win. Empty deck at required draw also means defeat.</li></ul><p><b>Prototype simplifications:</b> spells resolve immediately and choose the first valid target; trap responses are automatic; no chain stack, multi-copy deck limits, or formal priority timing.</p>');
$("closeModal").onclick=closeModal;$("endTurn").onclick=endTurn;$("cancelAction").onclick=()=>{state.selectedHand=null;state.selectedMonster=null;state.attackMode=false;render();setAction("Your move","Select a card from your hand.")};
$("attackMode").onclick=()=>{state.attackMode=true;setAction("Choose an attack target","Select an opposing monster. If their field is empty, select your attacker again to attack directly.");render()};
$("defMode").onclick=changePosition;$("useEffect").onclick=useMonsterEffect;
init();

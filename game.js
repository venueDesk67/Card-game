window.EquinoxGame = class {
  constructor(onUpdate,notify){this.onUpdate=onUpdate||(()=>{});this.notify=notify||(()=>{});this.reset("Aether","normal");}
  reset(playerFaction="Aether",difficulty="normal"){
    const cpuFaction=playerFaction==="Aether"?"Umbra":"Aether";
    const make=faction=>({faction,deck:this.shuffle(window.EQUINOX_CARDS.filter(c=>c.faction===faction).map(c=>({...c}))),hand:[],monsters:Array(5).fill(null),backrow:Array(5).fill(null),grave:[],lp:4000,normalSummoned:false,tributedThisTurn:false});
    this.state={turn:1,current:"player",phase:"main",players:{player:make(playerFaction),cpu:make(cpuFaction)},ended:false,log:[],difficulty,protection:{player:false,cpu:false},attackReduction:0,cancelAttack:false,destroyAttackerIfWeak:false,negateNextEffect:false,stats:{summons:0,attacks:0,damage:0}};
    this.state.players.player.hand=this.state.players.player.deck.splice(-5);
    this.state.players.cpu.hand=this.state.players.cpu.deck.splice(-5);
    this.state.players.player.normalSummoned=false;this.state.players.cpu.normalSummoned=false;
    this.say("The duel begins. "+playerFaction+" moves first. The first player does not draw on turn one.");
    this.update();
  }
  shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  player(side){return this.state.players[side];}
  opponent(side){return this.player(side==="player"?"cpu":"player");}
  say(s){this.state.log.unshift(s);this.state.log=this.state.log.slice(0,45);}
  log(s){this.say(s);this.update();}
  update(){this.onUpdate(this.state);}
  notify(s){this.notifyUser(s);}
  notifyUser(s){this.notify(s);}
  draw(side){const p=this.player(side);if(!p.deck.length){this.finish(side==="player"?"cpu":"player","deck-out");return false;}p.hand.push(p.deck.pop());this.say((side==="player"?"You":"The CPU")+" draw a card.");return true;}
  currentAtk(m){return Math.max(0,m.atk+(m.atkBonus||0));}
  currentDef(m){return Math.max(0,m.def+(m.defBonus||0));}
  makeFieldMonster(card,position="attack"){return {...card,position,attacked:false,positionChanged:false,effectUsed:false,atkBonus:0,defBonus:0,protectionReady:false,tributeSummon:false};}
  tributeCost(card){return window.EQUINOX_RULES.tributeCost(card.level);}
  canSummon(side,card){const p=this.player(side);if(!window.EQUINOX_RULES.validateCard(card)||card.type!=="Monster")return {ok:false,reason:"That card cannot be summoned."};if(p.normalSummoned)return {ok:false,reason:"Your Normal Summon has already been used this turn."};if(!p.monsters.some(x=>!x))return {ok:false,reason:"All monster zones are occupied."};const n=this.tributeCost(card);if(p.monsters.filter(Boolean).length<n)return {ok:false,reason:"You need "+n+" Tribute monster(s)."};return {ok:true,tributes:n};}
  summon(side,handIndex,zoneIndex,tributeIndices=[],position="attack"){
    const p=this.player(side),card=p.hand[handIndex],check=this.canSummon(side,card);
    if(!check.ok){this.notify(check.reason);return false;}
    if(p.monsters[zoneIndex]){this.notify("That monster zone is occupied.");return false;}
    if(tributeIndices.length!==check.tributes||new Set(tributeIndices).size!==tributeIndices.length||tributeIndices.some(i=>!p.monsters[i])){this.notify("Select exactly "+check.tributes+" valid Tribute(s).");return false;}
    p.hand.splice(handIndex,1);
    const tributed=tributeIndices.slice().sort((a,b)=>b-a).map(i=>{const m=p.monsters[i];p.monsters[i]=null;return m;});
    tributed.forEach(m=>{p.grave.push(m);this.resolveTribute(side,m,card);});
    const field=this.makeFieldMonster(card,position);field.tributeSummon=tributeIndices.length>0;p.monsters[zoneIndex]=field;p.normalSummoned=true;this.state.stats.summons++;
    this.say((side==="player"?"You summon ":"The CPU summons ")+card.name+(tributed.length?" by Tribute":"")+".");
    this.trigger("summon",side,field);
    if(field.tributeSummon)this.trigger("tributeSummon",side,field);
    this.update();return true;
  }
  resolveTribute(side,monster,summoned){const key=monster.effectKey;if(key==="dawn"&&summoned.faction==="Aether")this.draw(side);if(key==="acolyte"&&summoned.faction==="Umbra")this.damage(side==="player"?"cpu":"player",300);}
  trigger(trigger,side,card){const r=window.EQUINOX_EFFECTS.resolve(card.effectKey,{game:this,side,card});if(r&&r.trigger===trigger&&r.run)r.run();}
  useEffect(side,index){const p=this.player(side),m=p.monsters[index];if(!m)return false;const r=window.EQUINOX_EFFECTS.resolve(m.effectKey,{game:this,side,card:m});if(!r||r.trigger!=="manual"){this.notify("This monster has no available activated effect.");return false;}if(m.effectUsed||m.protectUsed){this.notify("This effect has already been used.");return false;}if(m.effectKey==="reaper"&&!this.opponent(side).monsters.some(Boolean)){this.notify("There is no opposing monster to target.");return false;}if(m.effectKey==="malgrath"&&!this.opponent(side).monsters.some(x=>x&&this.currentAtk(x)<=2000)){this.notify("No valid opposing monster.");return false;}r.run();this.update();return true;}
  playSpell(side,handIndex){const p=this.player(side),card=p.hand[handIndex];if(!card||card.type!=="Spell")return false;const key=card.effectKey;if(key==="soulharvest"&&!p.tributedThisTurn){this.notify("Soul Harvest requires a Tribute this turn.");return false;}if(["blessing","pact"].includes(key)&&!p.monsters.some(Boolean)){this.notify("You need a face-up monster to target.");return false;}if(["restoration","abyssal"].includes(key)&&!p.grave.some(c=>c.type==="Monster"&&(key!=="abyssal"||c.faction==="Umbra"))){this.notify("No valid monster in your Graveyard.");return false;}p.hand.splice(handIndex,1);p.grave.push(card);this.say((side==="player"?"You activate ":"The CPU activates ")+card.name+".");const r=window.EQUINOX_EFFECTS.resolve(key,{game:this,side,card});if(r&&r.run)r.run();this.update();return true;}
  setTrap(side,handIndex,zoneIndex){const p=this.player(side),c=p.hand[handIndex];if(!c||c.type!=="Trap"||p.backrow[zoneIndex])return false;p.hand.splice(handIndex,1);p.backrow[zoneIndex]={...c,setTurn:this.state.turn,faceDown:true};this.say((side==="player"?"You set a Trap.":"The CPU sets a Trap.") );this.update();return true;}
  activateSet(side,index){const p=this.player(side),c=p.backrow[index];if(!c)return false;if(c.type==="Trap"){this.notify("Set Traps activate automatically when their conditions occur.");return false;}p.backrow[index]=null;p.grave.push(c);const r=window.EQUINOX_EFFECTS.resolve(c.effectKey,{game:this,side,card:c});if(r&&r.run)r.run();this.update();return true;}
  damage(side,amount){const p=this.player(side);p.lp=Math.max(0,p.lp-amount);this.state.stats.damage+=amount;this.say((side==="player"?"You take ":"The CPU takes ")+amount+" damage.");if(p.lp<=0)this.finish(side==="player"?"cpu":"player","life-points");}
  heal(side,amount){const p=this.player(side);p.lp=Math.min(4000,p.lp+amount);this.say((side==="player"?"You recover ":"The CPU recovers ")+amount+" LP.");}
  destroyMonster(side,index,reason="battle"){const p=this.player(side),m=p.monsters[index];if(!m)return false;if(m.protectionReady){m.protectionReady=false;this.say(m.name+" is protected from destruction.");return false;}const guardian=p.monsters.find(x=>x&&x.effectKey==="elysius"&&!x.protectUsed&&x!==m);if(guardian){guardian.protectUsed=true;this.say("Elysius protects "+m.name+" from destruction.");return false;}p.monsters[index]=null;p.grave.push(m);this.say(m.name+" is destroyed ("+reason+").");if(reason==="battle"&&m.effectKey==="imp")this.damage(side==="player"?"cpu":"player",300);this.trigger("allyDestroyed",side,m);return true;}
  sendToGrave(side,zone,index){const p=this.player(side),c=p[zone][index];if(!c)return;p[zone][index]=null;p.grave.push(c);this.say(c.name+" is sent to the Graveyard.");}
  attack(attackerSide,attackerIndex,targetIndex=null){const a=this.player(attackerSide),d=this.opponent(attackerSide),m=a.monsters[attackerIndex];if(!m||m.position!=="attack"||m.attacked||this.state.ended)return false;
    if(this.state.protection[attackerSide==="player"?"cpu":"player"]){this.state.protection[attackerSide==="player"?"cpu":"player"]=false;m.attacked=true;this.say("Sacred Barrier prevents the attack.");this.update();return true;}
    const trapSide=attackerSide==="player"?"cpu":"player";const trap=this.resolveAttackTraps(trapSide,m);if(trap==="cancel"){m.attacked=true;this.update();return true;}let atk=this.currentAtk(m);if(this.state.attackReduction){atk=Math.max(0,atk-this.state.attackReduction);this.state.attackReduction=0;}
    if(this.state.destroyAttackerIfWeak&&atk<=1500){this.state.destroyAttackerIfWeak=false;this.destroyMonster(attackerSide,attackerIndex,"Divine Retribution");m.attacked=true;this.update();return true;}this.state.destroyAttackerIfWeak=false;
    m.attacked=true;this.state.stats.attacks++;
    if(targetIndex===null||!d.monsters[targetIndex]){if(d.monsters.some(Boolean)){this.notify("Choose an opposing monster to attack.");return false;}this.damage(attackerSide==="player"?"cpu":"player",atk);this.update();return true;}
    const target=d.monsters[targetIndex];const defValue=target.position==="def"?this.currentDef(target):this.currentAtk(target);
    if(target.position==="def"){if(atk>defValue)this.destroyMonster(attackerSide==="player"?"cpu":"player",targetIndex,"battle");else if(atk<defValue)this.damage(attackerSide,defValue-atk);}
    else if(atk>defValue){this.destroyMonster(attackerSide==="player"?"cpu":"player",targetIndex,"battle");this.damage(attackerSide==="player"?"cpu":"player",atk-defValue);}
    else if(atk<defValue){this.destroyMonster(attackerSide,attackerIndex,"battle");this.damage(attackerSide,defValue-atk);}
    else{this.destroyMonster(attackerSide,attackerIndex,"battle");this.destroyMonster(attackerSide==="player"?"cpu":"player",targetIndex,"battle");}
    this.update();return true;
  }
  resolveAttackTraps(side,attacker){const p=this.player(side);for(let i=0;i<p.backrow.length;i++){const c=p.backrow[i];if(!c||c.type!=="Trap"||this.state.turn<=c.setTurn)continue;const key=c.effectKey;if(!["intervention","retribution","hellfire","chains"].includes(key))continue;p.backrow[i]=null;p.grave.push(c);this.say(c.name+" activates.");const r=window.EQUINOX_EFFECTS.resolve(key,{game:this,side,card:c});if(r&&r.run)r.run();if(key==="chains"){this.state.cancelAttack=false;return "cancel";}}return null;}
  changePosition(side,index){const m=this.player(side).monsters[index];if(!m||m.positionChanged||m.attacked){this.notify("This monster cannot change position now.");return false;}m.position=m.position==="attack"?"def":"attack";m.positionChanged=true;this.say(m.name+" changes to "+m.position.toUpperCase()+" Position.");this.update();return true;}
  endTurn(){if(this.state.ended)return;const side=this.state.current;if(side==="player"){this.state.current="cpu";this.state.phase="draw";this.state.players.cpu.normalSummoned=false;this.state.players.cpu.tributedThisTurn=false;this.state.players.cpu.monsters.forEach(m=>{if(m){m.attacked=false;m.positionChanged=false;m.effectUsed=false;m.protectUsed=false;m.atkBonus=0;m.defBonus=0;}});this.draw("cpu");this.state.phase="main";this.update();return;}
    this.state.current="player";this.state.phase="draw";this.state.players.player.normalSummoned=false;this.state.players.player.tributedThisTurn=false;this.state.players.player.monsters.forEach(m=>{if(m){m.attacked=false;m.positionChanged=false;m.effectUsed=false;m.protectUsed=false;m.atkBonus=0;m.defBonus=0;}});this.state.turn++;this.state.protection.player=false;this.state.protection.cpu=false;this.draw("player");this.state.phase="main";this.update();
  }
  finish(winner,reason){if(this.state.ended)return;this.state.ended=true;this.state.winner=winner;this.state.reason=reason;this.state.phase="end";this.say((winner==="player"?"You win":"The CPU wins")+" by "+(reason==="deck-out"?"deck-out":"Life Points")+".");this.update();}
  concede(){this.finish("cpu","concession");}
};

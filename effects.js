window.EQUINOX_EFFECTS = (() => {
  function resolve(key,ctx){
    const {game,side,card,targetIndex} = ctx, own=game.player(side), foe=game.opponent(side);
    const firstMonster=p=>p.monsters.findIndex(Boolean), firstSpell=p=>p.backrow.findIndex(Boolean);
    const ownIndex=firstMonster(own), foeIndex=firstMonster(foe);
    const targetOwn=ownIndex>=0?own.monsters[ownIndex]:null, targetFoe=foeIndex>=0?foe.monsters[foeIndex]:null;
    const spell=(idx,atk,def=0)=>{if(idx>=0){own.monsters[idx].atkBonus=(own.monsters[idx].atkBonus||0)+atk;own.monsters[idx].defBonus=(own.monsters[idx].defBonus||0)+def;}};
    switch(key){
      case "dawn": return {trigger:"tribute",run(){game.draw(side);}};
      case "acolyte": return {trigger:"tribute",run(){game.damage(side==="player"?"cpu":"player",300);}};
      case "seraph": return {trigger:"manual",run(){card.defBonus=(card.defBonus||0)+300;card.effectUsed=true;game.log(card.name+" gains 300 DEF until your next turn.");}};
      case "priestess": return {trigger:"summon",run(){const i=own.grave.findIndex(c=>c.faction==="Aether"&&c.type==="Monster"&&c.level<=3);if(i>=0)own.hand.push(own.grave.splice(i,1)[0]);}};
      case "valtherion": case "hellhound": return {trigger:"continuous"};
      case "elysius": return {trigger:"manual",run(){const ally=own.monsters.find(m=>m&&m!==card&&!m.protectionReady);if(!ally){game.notify("Elysius needs another allied monster to protect.");return;}ally.protectionReady=true;card.protectUsed=true;game.log("Elysius shields "+ally.name+" from the next destruction.");}};
      case "astrael": return {trigger:"tributeSummon",run(){if(foeIndex>=0)game.destroyMonster(side==="player"?"cpu":"player",foeIndex,"Astrael's Divine Summon");}};
      case "imp": return {trigger:"destroyedBattle",run(){game.damage(side==="player"?"cpu":"player",300);}};
      case "reaper": return {trigger:"manual",run(){if(foeIndex>=0){foe.monsters[foeIndex].atkBonus=(foe.monsters[foeIndex].atkBonus||0)-300;card.effectUsed=true;game.log("Chaos Reaper weakens "+foe.monsters[foeIndex].name+".");}}};
      case "varkos": return {trigger:"tributeSummon",run(){card.atkBonus=(card.atkBonus||0)+500;}};
      case "malgrath": return {trigger:"manual",run(){const i=foe.monsters.findIndex(m=>m&&game.currentAtk(m)<=2000);if(i>=0){game.destroyMonster(side==="player"?"cpu":"player",i,"Malgrath's effect");card.effectUsed=true;}else game.notify("No opposing monster with 2000 ATK or less.");}};
      case "zarakiel": return {trigger:"tributeSummon",run(){game.damage(side==="player"?"cpu":"player",800);}};
      case "blessing": case "pact": return {trigger:"spell",run(){if(ownIndex>=0)spell(ownIndex,500);else game.notify("You need a face-up monster to target.");}};
      case "restoration": case "abyssal": return {trigger:"spell",run(){const i=own.grave.findIndex(c=>c.type==="Monster"&&(key!=="abyssal"||c.faction==="Umbra"));if(i>=0)own.hand.push(own.grave.splice(i,1)[0]);else game.notify("There is no valid monster in your Graveyard.");}};
      case "draw": return {trigger:"spell",run(){game.draw(side);}};
      case "soulharvest": return {trigger:"spell",run(){if(own.tributedThisTurn)game.draw(side);else game.notify("Soul Harvest requires a Tribute this turn.");}};
      case "barrier": return {trigger:"spell",run(){game.state.protection[side]=true;}};
      case "judgment": case "cataclysm": return {trigger:"spell",run(){const i=firstSpell(foe);if(i>=0)game.sendToGrave(side==="player"?"cpu":"player","backrow",i);else game.notify("No opposing Spell or Trap is available.");}};
      case "curse": return {trigger:"spell",run(){if(foeIndex>=0)foe.monsters[foeIndex].atkBonus=(foe.monsters[foeIndex].atkBonus||0)-500;else game.notify("No opposing monster to target.");}};
      case "intervention": return {trigger:"attackTrap",run(){game.state.attackReduction=1000;}};
      case "reversal": return {trigger:"effectTrap",run(){game.state.negateNextEffect=true;}};
      case "retribution": return {trigger:"attackTrap",run(){game.state.destroyAttackerIfWeak=true;}};
      case "hellfire": return {trigger:"attackTrap",run(){game.damage(side==="player"?"cpu":"player",500);}};
      case "chains": return {trigger:"attackTrap",run(){game.state.cancelAttack=true;}};
      case "rebirth": return {trigger:"allyDestroyed",run(){const i=own.grave.findIndex(c=>c.type==="Monster"&&c.faction==="Umbra"&&c.level<=4);const z=own.monsters.findIndex(x=>!x);if(i>=0&&z>=0){const [c]=own.grave.splice(i,1);own.monsters[z]=game.makeFieldMonster(c,"def");}}};
      default:return null;
    }
  }
  return {resolve};
})();

window.EquinoxCPU = class {
  constructor(game,render){this.game=game;this.render=render;}
  async takeTurn(){const g=this.game,s=g.state;if(s.ended||s.current!=="cpu")return;await this.wait(450);if(s.ended)return;
    const p=g.player("cpu");
    // Prefer spells with legal targets, then a summon with a sensible tribute choice.
    for(let i=p.hand.length-1;i>=0;i--){const c=p.hand[i];if(c.type==="Spell"){if(g.playSpell("cpu",i))await this.wait(350);}}
    if(!p.normalSummoned){
      const monsters=p.hand.map((c,i)=>({c,i})).filter(x=>x.c.type==="Monster").sort((a,b)=>b.c.atk-a.c.atk);
      for(const x of monsters){const cost=g.tributeCost(x.c);const occupied=p.monsters.map((m,i)=>m?i:-1).filter(i=>i>=0);if(occupied.length<cost)continue;
        const free=p.monsters.findIndex(m=>!m);if(free<0)break;
        const tributes=occupied.sort((a,b)=>g.player("cpu").monsters[a].atk-g.player("cpu").monsters[b].atk).slice(0,cost);
        const handIndex=p.hand.findIndex(c=>c.id===x.c.id);if(g.summon("cpu",handIndex,free,tributes,x.c.def>x.c.atk?"def":"attack")){await this.wait(450);break;}
      }
    }
    for(let i=p.hand.length-1;i>=0;i--){if(p.hand[i]&&p.hand[i].type==="Trap"){const z=p.backrow.findIndex(x=>!x);if(z>=0){g.setTrap("cpu",i,z);await this.wait(250);}}}
    // Activate one useful monster effect per turn.
    for(let i=0;i<p.monsters.length;i++){const m=p.monsters[i];if(m&&["seraph","reaper","malgrath","elysius"].includes(m.effectKey)&&!m.effectUsed&&!m.protectUsed){g.useEffect("cpu",i);await this.wait(350);}}
    // Change a weak attacker to defence when it cannot win a likely battle.
    const foe=g.player("player");
    for(let i=0;i<p.monsters.length;i++){const m=p.monsters[i];if(!m||m.position!=="attack"||m.positionChanged)continue;const strongest=Math.max(0,...foe.monsters.filter(Boolean).map(x=>g.currentAtk(x)));if(strongest>g.currentAtk(m)+350&&g.currentDef(m)>g.currentAtk(m)){g.changePosition("cpu",i);}}
    // Attack only when profitable or when no opposing monster remains.
    for(let i=0;i<p.monsters.length;i++){const m=p.monsters[i];if(!m||m.position!=="attack"||m.attacked)continue;const targets=foe.monsters.map((x,j)=>({x,j})).filter(x=>x.x);
      if(!targets.length){g.attack("cpu",i,null);await this.wait(350);continue;}
      const ranked=targets.map(t=>({ ...t, diff:g.currentAtk(m)-(t.x.position==="def"?g.currentDef(t.x):g.currentAtk(t.x)) })).sort((a,b)=>b.diff-a.diff);
      const best=ranked[0];if(best.diff>=0||s.difficulty==="easy"||s.difficulty==="hard"&&best.diff>=-200){g.attack("cpu",i,best.j);await this.wait(400);}
    }
    if(!s.ended){g.endTurn();this.render();} 
  }
  wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
};

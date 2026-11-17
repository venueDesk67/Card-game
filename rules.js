window.EQUINOX_RULES = {
  STARTING_LP:4000, OPENING_HAND:5, DRAW_PER_TURN:1, ZONES:5,
  TRIBUTES:{1:0,2:0,3:0,4:0,5:1,6:1,7:2,8:2,9:3,10:3},
  PHASES:["draw","main","battle","end"],
  tributeCost(level){return this.TRIBUTES[level] ?? 0;},
  validateCard(card){return !!card && !!card.id && ["Aether","Umbra"].includes(card.faction) && ["Monster","Spell","Trap"].includes(card.type);}
};

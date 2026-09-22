const events=new Set(['game_started','game_completed','game_abandoned','challenge_shared','practice_started','practice_completed','replay_opened','mistake_review_opened']);
const modes=new Set(['beginner','intermediate','expert','custom','daily','zen-beginner','zen-intermediate','zen-expert','practice','replay']);

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/events'&&request.method==='POST'){
      let data;
      try{data=await request.json()}catch{return new Response(null,{status:400})}
      if(!events.has(data.event)||!modes.has(data.mode))return new Response(null,{status:400});
      env.GAME_EVENTS.writeDataPoint({blobs:[data.event,data.mode,data.result||'',data.device||''],doubles:[Number(data.seconds)||0,Number(data.mistakes)||0],indexes:[data.event]});
      return new Response(null,{status:204});
    }
    return env.ASSETS.fetch(request);
  }
};

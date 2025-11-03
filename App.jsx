
import React, { useEffect, useMemo, useState, useRef } from 'react';

const START = new Date(2025,10,3);
const END = new Date(2025,11,7);

function getDaysArray(start, end) {
  const arr = []; const d = new Date(start);
  while (d <= end) { arr.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return arr;
}
function fmt(d){ return d.toISOString().slice(0,10); }
function readable(d){ return d.toLocaleDateString(undefined,{day:'2-digit',month:'short'}); }

const dayList = getDaysArray(START, END).map(fmt);
const STORAGE = 'clatdesu_final_data';
const SYL_KEY = 'clatdesu_final_syl';

function defaultDay(k){ return { date:k, tasks:{legal:false,english:false,gk:false,logic:false,quant:false,mock:false,analysis:false}, mockScore:null, notes:"", minutesStudied:0}; }

const SYL = {
  legal:['Legal propositions','Apply principles to facts','Public policy problems','Legal terminology'],
  english:['Long RCs','Inference & tone','Vocab in context','Summarising passages'],
  gk:['Current affairs (last 12 mo)','Static (Constitution/history)','International affairs','Arts & culture'],
  logic:['Short passages','Deduction & inference','Cause-effect','Syllogism & puzzles'],
  quant:['Basic arithmetic','Data interpretation','Ratio & percent','Time & work']
};

const QUOTES = [
  "Small daily improvements are the key to staggering long-term results.",
  "Discipline is choosing between what you want now and what you want most.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Focus on progress, not perfection."
];

export default function App(){
  const [data, setData] = useState(()=>{ try{ const raw = localStorage.getItem(STORAGE); if(raw) return JSON.parse(raw); }catch(e){} const init={}; dayList.forEach(d=> init[d]=defaultDay(d)); return init; });
  const [syl, setSyl] = useState(()=>{ try{ const raw = localStorage.getItem(SYL_KEY); if(raw) return JSON.parse(raw); }catch(e){} const p={}; Object.keys(SYL).forEach(k=> p[k]=SYL[k].map(()=>false)); return p; });
  const [selected, setSelected] = useState(dayList[0]);
  const [auth, setAuth] = useState(()=> sessionStorage.getItem('clatdesu_auth') === '1');
  const PASSWORD = 'clatdesu';

  // timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(()=> { localStorage.setItem(STORAGE, JSON.stringify(data)); }, [data]);
  useEffect(()=> { localStorage.setItem(SYL_KEY, JSON.stringify(syl)); }, [syl]);

  useEffect(()=>{ if(!auth){ const p = prompt('Enter dashboard passcode:'); if(p === PASSWORD){ sessionStorage.setItem('clatdesu_auth','1'); setAuth(true); } else { alert('Wrong passcode. Reload to try again.'); } } }, []);

  // Timer effects
  useEffect(()=>{
    if(timerRunning){
      timerRef.current = setInterval(()=> setTimerSeconds(s=> s+1), 1000);
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return ()=> clearInterval(timerRef.current);
  }, [timerRunning]);

  function startTimer(){ setTimerRunning(true); }
  function pauseTimer(){ setTimerRunning(false); }
  function stopAndSave(){ 
    setTimerRunning(false);
    const mins = Math.round(timerSeconds/60);
    setTimerSeconds(0);
    setData(old=> { const copy = {...old}; copy[selected].minutesStudied = (copy[selected].minutesStudied || 0) + mins; return copy; });
  }

  const toggleTask = (key, t) => setData(old => ({ ...old, [key]: { ...old[key], tasks: { ...old[key].tasks, [t]: !old[key].tasks[t] } } }));
  const updateDay = (key, patch) => setData(old => ({ ...old, [key]: { ...old[key], ...patch } }));

  const completion = useMemo(()=>{
    let done=0,total=0;
    dayList.forEach(k=>{ const d = data[k]; if(!d) return; const vals = Object.values(d.tasks).slice(0,6); done+=vals.filter(Boolean).length; total+=vals.length; });
    return {done,total,pct: total? Math.round((done/total)*100):0};
  }, [data]);

  const mockSeries = useMemo(()=> dayList.map(k=> ({date:k, score: data[k] && data[k].mockScore != null ? data[k].mockScore : null})), [data]);
  const avgMock = useMemo(()=>{ const s = mockSeries.filter(d=> d.score != null).map(d=> d.score); if(!s.length) return null; return +(s.reduce((a,b)=>a+b,0)/s.length).toFixed(2); }, [mockSeries]);
  function estimateRank(m){ if(m==null) return '—'; if(m>=100) return '1–10'; if(m>=95) return '10–50'; if(m>=90) return '50–150'; if(m>=85) return '150–400'; if(m>=80) return '400–800'; if(m>=70) return '800–2000'; return '2000+'; }

  const streak = useMemo(()=>{
    const keys = dayList.slice().reverse();
    let s=0;
    for(const k of keys){
      const d = data[k]; if(!d) break;
      const all = Object.values(d.tasks).slice(0,6).every(Boolean);
      if(all) s++; else break;
    }
    return s;
  }, [data]);

  function resetAll(){ if(!confirm('Reset all data?')) return; const init={}; dayList.forEach(d=> init[d]=defaultDay(d)); setData(init); const p={}; Object.keys(SYL).forEach(k=> p[k]=SYL[k].map(()=>false)); setSyl(p); }

  function backup(){ const blob = new Blob([JSON.stringify({data,syl})], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='clatdesu_backup.json'; a.click(); URL.revokeObjectURL(url); }

  function exportPDF(){ window.print(); }

  const quote = QUOTES[Math.floor(Math.random()*QUOTES.length)];

  if(!auth) return <div style={{padding:20}}>Locked - reload and enter passcode.</div>;

  return (
    <div style={{fontFamily:'Inter,Arial,Helvetica', padding:16, minHeight:'100vh', background:'linear-gradient(180deg,#0f1727,#203a43,#2c5364)', color:'#e6f0f0'}}>
      <div style={{maxWidth:1000, margin:'0 auto'}}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <div>
            <h1 style={{margin:0, color:'#e6f0f0'}}>CLATdesu Dashboard</h1>
            <div style={{color:'#d1e7ee'}}><small>Personal CLAT 2026 tracker • {fmt(START)} → {fmt(END)}</small></div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <div style={{background:'rgba(255,255,255,0.05)', padding:8, borderRadius:8, color:'#cfeff6'}}>Theme: Auto</div>
            <div style={{background:'#07203a', color:'#7be3ff', padding:8, borderRadius:8}}>Avg Mock: <strong>{avgMock ?? '—'}</strong></div>
            <div style={{background:'#07203a', color:'#7be3ff', padding:8, borderRadius:8}}>Est Rank: <strong>{estimateRank(avgMock)}</strong></div>
          </div>
        </header>

        <div style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:12}}>
          <main>
            <section style={{background:'rgba(255,255,255,0.03)', padding:12, borderRadius:12}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><strong>Daily Focus</strong><div style={{color:'#cfeff6'}} className="small">Track tasks and study minutes</div></div>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <div style={{background:'#07203a', color:'#7be3ff', padding:8, borderRadius:8}}>{completion.pct}%</div>
                  <button onClick={exportPDF} style={{padding:8, borderRadius:8, background:'#7be3ff', border:'none', color:'#07203a'}}>Export PDF</button>
                </div>
              </div>

              <div style={{marginTop:12, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
                <div style={{flex:'1 1 280px'}}>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <div style={{fontSize:12, color:'#cfeff6'}}>Timer</div>
                    <div style={{marginLeft:'auto', fontSize:14, color:'#cfeff6'}}>{Math.floor(timerSeconds/60).toString().padStart(2,'0')}:{(timerSeconds%60).toString().padStart(2,'0')}</div>
                  </div>
                  <div style={{marginTop:8, display:'flex', gap:8}}>
                    <button className="btn" onClick={startTimer} disabled={timerRunning}>Start</button>
                    <button className="btn" onClick={pauseTimer} disabled={!timerRunning}>Pause</button>
                    <button className="btn" onClick={stopAndSave}>Stop & Save</button>
                  </div>
                  <div style={{marginTop:10, color:'#cfeff6'}}>Minutes studied today: <strong>{data[selected].minutesStudied || 0}</strong></div>
                </div>

                <div style={{width:220, padding:10, borderRadius:8, background:'rgba(255,255,255,0.02)'}}>
                  <div style={{fontSize:13, color:'#cfeff6', marginBottom:6}}>Quote of the moment</div>
                  <div style={{fontWeight:700, color:'#7be3ff'}}>"{quote}"</div>
                </div>
              </div>

            </section>

            <section style={{marginTop:12, background:'rgba(255,255,255,0.03)', padding:12, borderRadius:12}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><strong>Checklist & Syllabus</strong><div style={{color:'#cfeff6'}} className="small">Tap to mark topics done</div></div>
                <div className="small" style={{color:'#cfeff6'}}>Streak: {streak} days</div>
              </div>

              <div style={{marginTop:8, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8}}>
                {dayList.map(d=> (
                  <button key={d} onClick={()=> setSelected(d)} style={{padding:8, borderRadius:8, background: selected===d? '#07203a':'rgba(255,255,255,0.03)', color: selected===d? '#7be3ff':'#e6f0f0', border:'none'}}>{readable(new Date(d))}</button>
                ))}
              </div>

              <div style={{marginTop:10, display:'flex', gap:8, flexDirection:'column'}}>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {Object.keys(data[selected].tasks).map(t=> (
                    <button key={t} onClick={()=> toggleTask(selected,t)} style={{padding:8, borderRadius:8, background: data[selected].tasks[t]? '#07203a':'rgba(255,255,255,0.03)', color: data[selected].tasks[t]? '#7be3ff':'#e6f0f0', border:'none'}}>{t}</button>
                  ))}
                </div>
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <input type="number" placeholder="Mock score" value={data[selected].mockScore==null? '': data[selected].mockScore} onChange={e=> updateDay(selected, {mockScore: e.target.value===''? null: Number(e.target.value)})} style={{padding:8, borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', width:120, background:'transparent', color:'#e6f0f0'}} />
                  <input type="text" placeholder="Short notes / errors" value={data[selected].notes} onChange={e=> updateDay(selected, {notes: e.target.value})} style={{flex:1, padding:8, borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'transparent', color:'#e6f0f0'}} />
                </div>
              </div>

            </section>

            <section style={{marginTop:12, background:'rgba(255,255,255,0.03)', padding:12, borderRadius:12}}>
              <strong>Mock Series</strong>
              <div style={{marginTop:8, display:'flex', gap:8, overflow:'auto'}}>
                {mockSeries.filter(d=> d.score!=null).map(d=> (
                  <div key={d.date} style={{minWidth:100, padding:8, borderRadius:8, background:'rgba(255,255,255,0.02)', textAlign:'center'}}>
                    <div style={{fontWeight:700, color:'#7be3ff'}}>{d.score}</div>
                    <div style={{fontSize:12, color:'#cfeff6'}}>{readable(new Date(d.date))}</div>
                  </div>
                ))}
              </div>
            </section>

          </main>

          <aside style={{display:'flex', flexDirection:'column', gap:12}}>
            <section style={{background:'rgba(255,255,255,0.03)', padding:12, borderRadius:12}}>
              <strong>Syllabus Progress</strong>
              <div style={{marginTop:8}}>
                {Object.keys(SYL).map(sec=> (
                  <div key={sec} style={{marginTop:10}}>
                    <div style={{fontWeight:700, textTransform:'capitalize'}}>{sec} <small style={{color:'#cfeff6'}}>({syl[sec].filter(Boolean).length}/{syl[sec].length})</small></div>
                    <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:6}}>
                      {SYL[sec].map((t,i)=> (
                        <label key={t} style={{background:'rgba(255,255,255,0.02)', padding:'6px 8px', borderRadius:8, display:'inline-flex', alignItems:'center', gap:6}}>
                          <input type="checkbox" checked={syl[sec][i]} onChange={()=> setSyl(old=> { const copy = {...old}; copy[sec][i] = !copy[sec][i]; return copy; })} /> <span style={{fontSize:13, color:'#e6f0f0'}}>{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{background:'rgba(255,255,255,0.03)', padding:12, borderRadius:12}}>
              <strong>Quick Actions</strong>
              <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:8}}>
                <button onClick={()=> { const today = fmt(new Date()); if(!data[today]) return alert('Today outside range'); Object.keys(data[today].tasks).forEach(k=> data[today].tasks[k]=true); setData({...data}); }} className="btn">Mark Today All Done</button>
                <button onClick={backup} className="btn" style={{background:'#7be3ff', color:'#07203a'}}>Backup JSON</button>
                <button onClick={resetAll} className="btn" style={{background:'rgba(255,255,255,0.06)', color:'#e6f0f0'}}>Reset All</button>
              </div>
            </section>

            <section style={{background:'rgba(255,255,255,0.03)', padding:12, borderRadius:12}}>
              <strong>Summary</strong>
              <div style={{marginTop:8, color:'#cfeff6'}}>Total minutes studied (range): <strong>{dayList.reduce((s,d)=> s + (data[d].minutesStudied||0),0)}</strong></div>
              <div style={{marginTop:6, color:'#cfeff6'}}>Completed tasks: <strong>{completion.done}</strong></div>
            </section>
          </aside>
        </div>

        <footer style={{textAlign:'center', marginTop:18, color:'#cfeff6'}}>Built for you • Private local data • Theme: Gradient Blue (auto)</footer>
      </div>
    </div>
  );
}

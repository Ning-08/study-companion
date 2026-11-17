import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlarmClock, BarChart3, Bell, Check, ChevronDown, CircleHelp, CloudRain, Coffee, Headphones, Leaf, ListTodo, LogIn, Menu, Minus, Music2, Pause, Play, Plus, RotateCcw, Settings2, Sprout, Sun, Volume2, VolumeX, X } from 'lucide-react';
import './style.css';

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const days = ['一','二','三','四','五','六','日'];
const sounds = [{ id:'rain', title:'窗邊雨聲', sub:'細雨落在屋簷', icon:CloudRain, color:'#92aaa1' }, { id:'cafe', title:'咖啡廳', sub:'午後的輕聲交談', icon:Coffee, color:'#be9478' }, { id:'forest', title:'森林漫步', sub:'鳥鳴與微風', icon:Leaf, color:'#91a77c' }];

function App() {
  const [tasks, setTasks] = useState(() => read('mori-tasks', [{ id:1, text:'複習第三章筆記', done:true },{ id:2, text:'完成英文閱讀練習', done:false },{ id:3, text:'整理課堂重點', done:false }]));
  const [minutes, setMinutes] = useState(() => read('mori-minutes', 25));
  const [seconds, setSeconds] = useState(25*60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState('專注');
  const [sound, setSound] = useState(() => read('mori-sound', 'rain'));
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(35);
  const [name, setName] = useState(() => read('mori-name', '小旅人'));
  const [buddy, setBuddy] = useState(() => read('mori-buddy', '🐻'));
  const [modal, setModal] = useState('');
  const [newTask, setNewTask] = useState('');
  const [notice, setNotice] = useState(false);
  const [stats, setStats] = useState(() => read('mori-stats', [1.2,2.1,1.5,2.8,1.8,2.4,0.8]));
  const audioRef = useRef(null);
  const totalSeconds = mode === '專注' ? minutes*60 : mode === '短休息' ? 5*60 : 15*60;
  const progress = 1 - seconds/totalSeconds;
  const today = new Date();
  const dateLabel = `${today.getFullYear()}年 ${today.getMonth()+1}月 ${today.getDate()}日`;

  useEffect(() => { write('mori-tasks', tasks); }, [tasks]);
  useEffect(() => { write('mori-minutes', minutes); }, [minutes]);
  useEffect(() => { write('mori-sound', sound); }, [sound]);
  useEffect(() => { write('mori-name', name); write('mori-buddy', buddy); }, [name, buddy]);
  useEffect(() => { write('mori-stats', stats); }, [stats]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds(s => {
      if (s <= 1) {
        setRunning(false);
        if (mode === '專注') setStats(prev => { const next=[...prev]; next[6]=Math.round((next[6]+minutes/60)*10)/10; return next; });
        setNotice(true); setTimeout(() => setNotice(false), 4000);
        return totalSeconds;
      }
      return s-1;
    }), 1000);
    return () => clearInterval(timer);
  }, [running, mode, minutes, totalSeconds]);

  useEffect(() => {
    if (!soundOn) { audioRef.current?.stop(); audioRef.current=null; return; }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*0.32;
      const source=ctx.createBufferSource(); source.buffer=buffer; source.loop=true;
      const filter=ctx.createBiquadFilter(); filter.type=sound==='cafe'?'lowpass':'lowpass'; filter.frequency.value=sound==='rain'?1100:sound==='cafe'?420:720;
      const gain=ctx.createGain(); gain.gain.value=volume/100*0.35;
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start();
      audioRef.current={ stop:()=>{ source.stop(); ctx.close(); }, gain };
    } catch { setSoundOn(false); }
    return () => { audioRef.current?.stop(); audioRef.current=null; };
  }, [soundOn, sound]);
  useEffect(() => { if (audioRef.current) audioRef.current.gain.gain.value=volume/100*0.35; }, [volume]);

  const clock = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const completed = tasks.filter(t=>t.done).length;
  const bars = useMemo(() => stats.map((v,i)=>({v, label:days[i]})), [stats]);
  const changeMode = m => { setMode(m); setRunning(false); setSeconds(m==='專注'?minutes*60:m==='短休息'?300:900); };
  const addTask = e => { e.preventDefault(); if (!newTask.trim()) return; setTasks([...tasks,{id:Date.now(),text:newTask.trim(),done:false}]); setNewTask(''); };
  const toggleTask = id => setTasks(tasks.map(t=>t.id===id?{...t,done:!t.done}:t));

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#home"><span className="brand-mark"><Sprout size={21}/></span><span>Mori<span className="brand-cn">森日</span></span></a>
      <div className="side-caption">你的讀書空間</div>
      <nav><a className="nav-item active" href="#home"><Sun size={18}/> 今日儀表板</a><a className="nav-item" href="#focus"><AlarmClock size={18}/> 專注計時</a><a className="nav-item" href="#tasks"><ListTodo size={18}/> 今日待辦 <span className="nav-count">{tasks.filter(t=>!t.done).length}</span></a><a className="nav-item" href="#stats"><BarChart3 size={18}/> 專注紀錄</a></nav>
      <div className="sidebar-bottom"><div className="side-note"><div className="note-icon">✦</div><p>每一次專注，<br/>都是給自己的禮物。</p><span>慢慢來，也很好。</span></div><button className="profile" onClick={()=>setModal('profile')}><span className="profile-avatar">{buddy}</span><span><b>{name}</b><small>我的小天地</small></span><ChevronDown size={15}/></button></div>
    </aside>
    <main className="main" id="home">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><Sprout size={19}/></span> Mori 森日</div><div className="crumb">我的空間 <span>/</span> <b>今日儀表板</b></div><div className="top-actions"><span className="date-pill">{dateLabel}</span><button className="icon-btn" aria-label="通知" onClick={()=>setNotice(!notice)}><Bell size={18}/><i/></button><button className="avatar-btn" onClick={()=>setModal('profile')}>{buddy}</button></div></header>
      {notice && <div className="toast"><Check size={16}/> {seconds===totalSeconds?'這段專注完成得真好，休息一下吧！':'今天也有好好照顧自己。'} <button onClick={()=>setNotice(false)}><X size={15}/></button></div>}
      <section className="welcome"><div><div className="eyebrow"><span className="eyebrow-dot"/> {today.toLocaleDateString('zh-TW',{weekday:'long'})} · 好好開始今天</div><h1>早安，{name}<span className="wave">☀️</span></h1><p>準備好和 {buddy} 一起，完成今天的小目標了嗎？</p></div><button className="customize-link" onClick={()=>setModal('profile')}><Settings2 size={16}/> 編輯我的空間</button></section>
      <section className="dashboard-grid">
        <article className="card focus-card" id="focus">
          <div className="section-head"><div><span className="kicker">FOCUS SESSION</span><h2>專注時光</h2></div><button className="more-btn" onClick={()=>setMinutes(minutes===25?50:25)}><Settings2 size={16}/><span>時長設定</span></button></div>
          <div className="mode-tabs">{['專注','短休息','長休息'].map(m=><button key={m} onClick={()=>changeMode(m)} className={mode===m?'selected':''}>{m}</button>)}</div>
          <div className="timer-area"><div className="timer-ring" style={{'--progress':`${progress*100}%`}}><div className="timer-inner"><div className="timer-label">{mode==='專注'?'保持步調':mode==='短休息'?'喘口氣':'好好放鬆'}</div><div className="timer-time">{clock}</div><div className="timer-sub">{mode==='專注'?'專注時間':`${mode}時間`}</div></div></div><div className="timer-buddy"><span>{buddy}</span><i className="sparkle">✦</i></div></div>
          <div className="timer-controls"><button className="reset-btn" onClick={()=>{setRunning(false);setSeconds(totalSeconds)}} aria-label="重設"><RotateCcw size={18}/></button><button className="start-btn" onClick={()=>setRunning(!running)}>{running?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}{running?'暫停專注':'開始專注'}</button><button className="reset-btn" onClick={()=>setSeconds(s=>Math.min(totalSeconds,s+60))} aria-label="增加一分鐘"><Plus size={18}/></button></div>
          <div className="session-hint"><span className="hint-dot"/> 已完成 <b>{Math.floor(stats.reduce((a,b)=>a+b,0)*2)}</b> 個專注時段 <span className="hint-divider">·</span> 今天再專注一點點</div>
        </article>
        <article className="card sound-card"><div className="section-head"><div><span className="kicker">SOUND SCAPE</span><h2>陪伴你的聲音</h2></div><button className={`sound-toggle ${soundOn?'on':''}`} onClick={()=>setSoundOn(!soundOn)}>{soundOn?<Volume2 size={17}/>:<VolumeX size={17}/>}<span>{soundOn?'播放中':'已關閉'}</span></button></div>
          <div className="sound-list">{sounds.map(s=>{const Icon=s.icon;return <button key={s.id} className={`sound-option ${sound===s.id?'chosen':''}`} onClick={()=>setSound(s.id)}><span className="sound-icon" style={{'--sound-color':s.color}}><Icon size={19}/></span><span className="sound-info"><b>{s.title}</b><small>{s.sub}</small></span>{sound===s.id&&<span className={`playing-bars ${soundOn?'anim':''}`}><i/><i/><i/></span>}</button>})}</div>
          <div className="volume-row"><VolumeX size={15}/><input aria-label="音量" type="range" min="0" max="100" value={volume} onChange={e=>setVolume(+e.target.value)}/><Volume2 size={16}/><span>{volume}%</span></div><div className="sound-footer"><Headphones size={14}/> 戴上耳機，讓心慢慢靜下來</div>
        </article>
      </section>
      <section className="lower-grid"><article className="card todo-card" id="tasks"><div className="section-head"><div><span className="kicker">TODAY'S PLAN</span><h2>今日待辦 <span className="task-counter">{completed}/{tasks.length}</span></h2></div><button className="text-action" onClick={()=>setTasks([...tasks,{id:Date.now(),text:'新增一個小目標',done:false}])}><Plus size={16}/> 新增</button></div><div className="task-progress"><div><span>今天的進度</span><b>{tasks.length?Math.round(completed/tasks.length*100):0}%</b></div><div className="progress-track"><i style={{width:`${tasks.length?completed/tasks.length*100:0}%`}}/></div></div><div className="task-list">{tasks.map(t=><div className={`task-row ${t.done?'done':''}`} key={t.id}><button className="check-box" onClick={()=>toggleTask(t.id)} aria-label={t.done?'標記未完成':'完成待辦'}>{t.done&&<Check size={14}/>}</button><span>{t.text}</span><button className="task-delete" onClick={()=>setTasks(tasks.filter(x=>x.id!==t.id))} aria-label="刪除"><X size={15}/></button></div>)}</div><form className="add-task" onSubmit={addTask}><Plus size={16}/><input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="寫下一件想完成的小事…"/><button type="submit">加入</button></form></article>
        <article className="card stats-card" id="stats"><div className="section-head"><div><span className="kicker">YOUR RHYTHM</span><h2>專注紀錄</h2></div><button className="period-select" onClick={()=>setStats(stats.map(()=>+(Math.random()*2.5+.4).toFixed(1)))}>本週 <ChevronDown size={14}/></button></div><div className="stats-total"><strong>{stats.reduce((a,b)=>a+b,0).toFixed(1)}</strong><span>小時</span><span className="stats-growth">✦ 持續累積中</span></div><div className="chart-wrap"><div className="chart-y"><span>3h</span><span>2h</span><span>1h</span><span>0</span></div><div className="chart">{bars.map((b,i)=><div className={`bar-col ${i===6?'today':''}`} key={i}><div className="bar-value">{b.v.toFixed(1)}h</div><div className="bar-track"><i style={{height:`${Math.min(b.v/3*100,100)}%`}}/></div><span>{b.label}</span></div>)}</div></div><div className="chart-legend"><i/> 每日專注時數 <span>目標 3 小時</span></div></article></section>
      <footer className="footer"><span>Made with care <span className="heart">♥</span> by Mori</span><span>把日子過成喜歡的樣子</span></footer>
    </main>
    {modal==='profile'&&<div className="modal-backdrop" onClick={()=>setModal('')}><div className="profile-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setModal('')}><X size={18}/></button><span className="kicker">YOUR LITTLE WORLD</span><h2>打造專屬小天地</h2><p>取個喜歡的名字，挑一位陪伴你的夥伴。</p><label className="field-label">怎麼稱呼你？</label><input className="name-input" value={name} onChange={e=>setName(e.target.value)} maxLength={12}/><label className="field-label">選擇陪伴角色</label><div className="buddy-grid">{['🐻','🐱','🐰','🦊','🐼','🐸','🐧','🦦'].map(x=><button onClick={()=>setBuddy(x)} className={buddy===x?'picked':''} key={x}>{x}</button>)}</div><button className="save-profile" onClick={()=>setModal('')}>完成設定 <Check size={17}/></button><div className="member-note"><span>✦</span> 你的專注紀錄與偏好會保存在這台裝置</div></div></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);

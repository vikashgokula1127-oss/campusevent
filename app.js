import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Change this ONLY if your host email is different.
const HOST_EMAIL = "nanigokula45@gmail.com";

const $ = id => document.getElementById(id);
const authCard = $("authCard"), appView = $("app"), authForm = $("authForm");
const authMsg = $("authMsg"), hostTabBtn = $("hostTabBtn"), userArea = $("userArea");

function msg(el, text, good=false){ el.textContent=text; el.style.color=good ? "#15803d" : "#c62828"; }

authForm.addEventListener("submit", async e=>{
  e.preventDefault(); msg(authMsg,"Signing in...",true);
  try{
    await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);
    msg(authMsg,"",true);
  }catch(err){ console.error(err); msg(authMsg,err.code+" — "+err.message); }
});

$("registerBtn").addEventListener("click", async ()=>{
  try{
    const email=$("email").value.trim(), password=$("password").value;
    if(!email || password.length<6) return msg(authMsg,"Enter email and password (minimum 6 characters).");
    await createUserWithEmailAndPassword(auth,email,password);
    msg(authMsg,"Account created. You are logged in.",true);
  }catch(err){ console.error(err); msg(authMsg,err.code+" — "+err.message); }
});

$("refreshEvents").addEventListener("click", loadEvents);
$("closeModal").addEventListener("click",()=>$("modal").classList.add("hidden"));

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tabPanel").forEach(x=>x.classList.add("hidden"));
    btn.classList.add("active"); $(btn.dataset.tab).classList.remove("hidden");
    if(btn.dataset.tab==="participateTab") loadMyRegistrations();
    if(btn.dataset.tab==="hostTab") loadAllRegistrations();
  });
});

async function loadEvents(){
  const box=$("eventsList"); box.innerHTML="<p>Loading...</p>";
  try{
    const snap=await getDocs(query(collection(db,"events"),orderBy("createdAt","desc")));
    if(snap.empty){box.innerHTML="<p class='muted'>No events yet.</p>";return;}
    box.innerHTML="";
    snap.forEach(d=>{
      const e=d.data();
      const card=document.createElement("div"); card.className="event";
      card.innerHTML=`<span class="badge">${escapeHtml(e.date||"")}</span>
        <h3>${escapeHtml(e.title||"Untitled")}</h3>
        <p>${escapeHtml(e.description||"")}</p>
        <p><b>Venue:</b> ${escapeHtml(e.venue||"")}</p>
        <p><b>Capacity:</b> ${escapeHtml(String(e.capacity||""))}</p>
        <button data-id="${d.id}" data-title="${escapeAttr(e.title||"")}">Participate</button>`;
      card.querySelector("button").onclick=()=>openRegistration(d.id,e.title||"");
      box.appendChild(card);
    });
  }catch(err){console.error(err);box.innerHTML="<p>Could not load events. Check Firebase config/rules.</p>";}
}

function openRegistration(id,title){
  $("regEventId").value=id;$("modalTitle").textContent="Register: "+title;
  $("regMsg").textContent=""; $("modal").classList.remove("hidden");
}
$("registrationForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const user=auth.currentUser;if(!user)return;
  try{
    await addDoc(collection(db,"registrations"),{
      eventId:$("regEventId").value,
      participantUid:user.uid,
      participantEmail:user.email,
      name:$("regName").value.trim(),
      rollNo:$("regRoll").value.trim(),
      department:$("regDepartment").value.trim(),
      phone:$("regPhone").value.trim(),
      createdAt:serverTimestamp()
    });
    msg($("regMsg"),"Participation saved successfully.",true);
    e.target.reset(); setTimeout(()=>$("modal").classList.add("hidden"),700);
  }catch(err){console.error(err);msg($("regMsg"),err.code+" — "+err.message);}
});

async function loadMyRegistrations(){
  const box=$("myRegistrations");box.innerHTML="<p>Loading...</p>";
  try{
    const snap=await getDocs(collection(db,"registrations"));
    const mine=[];snap.forEach(d=>{if(d.data().participantUid===auth.currentUser.uid)mine.push(d.data())});
    if(!mine.length){box.innerHTML="<p class='muted'>No participation records yet.</p>";return;}
    box.innerHTML=mine.map(r=>`<div class="event"><h3>${escapeHtml(r.name)}</h3>
      <p><b>Roll:</b> ${escapeHtml(r.rollNo)}</p><p><b>Department:</b> ${escapeHtml(r.department)}</p>
      <p><b>Event ID:</b> ${escapeHtml(r.eventId)}</p><span class="badge">Registered</span></div>`).join("");
  }catch(err){console.error(err);box.innerHTML="<p>Could not load records.</p>";}
}

$("eventForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!isHost()) return msg($("eventMsg"),"Host access required.");
  try{
    await addDoc(collection(db,"events"),{
      title:$("eventTitle").value.trim(),
      date:$("eventDate").value,
      venue:$("eventVenue").value.trim(),
      capacity:Number($("eventCapacity").value),
      description:$("eventDescription").value.trim(),
      createdBy:auth.currentUser.uid,
      createdByEmail:auth.currentUser.email,
      createdAt:serverTimestamp()
    });
    msg($("eventMsg"),"Event created successfully.",true); e.target.reset(); loadEvents();
  }catch(err){console.error(err);msg($("eventMsg"),err.code+" — "+err.message);}
});

async function loadAllRegistrations(){
  const box=$("allRegistrations");box.innerHTML="<p>Loading...</p>";
  try{
    const snap=await getDocs(collection(db,"registrations"));
    let rows="";
    snap.forEach(d=>{const r=d.data();rows+=`<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.rollNo)}</td><td>${escapeHtml(r.department)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.participantEmail||"")}</td><td>${escapeHtml(r.eventId)}</td></tr>`});
    box.innerHTML=rows?`<table class="table"><thead><tr><th>Name</th><th>Roll</th><th>Department</th><th>Phone</th><th>Email</th><th>Event ID</th></tr></thead><tbody>${rows}</tbody></table>`:"<p class='muted'>No participation records.</p>";
  }catch(err){console.error(err);box.innerHTML="<p>Could not load registrations.</p>";}
}

function isHost(){return !!auth.currentUser && auth.currentUser.email?.toLowerCase()===HOST_EMAIL.toLowerCase();}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function escapeAttr(v){return escapeHtml(v);}

onAuthStateChanged(auth,user=>{
  if(!user){
    authCard.classList.remove("hidden");appView.classList.add("hidden");userArea.innerHTML="";
    return;
  }
  authCard.classList.add("hidden");appView.classList.remove("hidden");
  userArea.innerHTML=`<span class="userEmail">${escapeHtml(user.email)}</span> <button id="logout" class="secondary">Logout</button>`;
  $("logout").onclick=()=>signOut(auth);
  const host=isHost();hostTabBtn.classList.toggle("hidden",!host);
  loadEvents();
});


// ---------- PASTE YOUR FIREBASE CONFIG HERE ----------
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAboClTBdBKpzvlEUTIf-8co35mqSrghcQ",
  authDomain: "siyuge-art-thoughts.firebaseapp.com",
  projectId: "siyuge-art-thoughts",
  storageBucket: "siyuge-art-thoughts.firebasestorage.app",
  messagingSenderId: "658057688409",
  appId: "1:658057688409:web:0b9159f8421b1a8921c848",
  measurementId: "G-0G50M56JK3"
};
// ----------------------------------------------------

// Import modular Firebase v9+ from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  signOut, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, updateDoc, doc, getDocs,
  query, where, orderBy, serverTimestamp, getDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const journalCol = collection(db, "journal");

// UI refs
const entriesEl = document.getElementById("entries");
const adminSection = document.getElementById("admin-section");
const adminEntriesEl = document.getElementById("admin-entries");
const authUi = document.getElementById("auth-ui");
const titleInput = document.getElementById("entry-title");
const descriptionInput = document.getElementById("entry-description");
const contentInput = document.getElementById("entry-content");
const publishedInput = document.getElementById("entry-published");
const saveBtn = document.getElementById("save-btn");
const updateBtn = document.getElementById("update-btn");
const cancelEditBtn = document.getElementById("cancel-edit");

// Initialize Quill editor (if Quill is loaded)
let quill = null;
try {
  if (window.Quill) {
    const textarea = contentInput;
    // hide the textarea (we already hid in HTML but ensure here)
    textarea.style.display = 'none';
    // use existing #editor container if present, otherwise create one
    let editorContainer = document.getElementById('editor');
    if (!editorContainer) {
      editorContainer = document.createElement('div');
      editorContainer.id = 'editor';
      textarea.parentNode.insertBefore(editorContainer, textarea);
    }


    quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image']
          ]
        }
      }
    });

    // Populate quill with existing textarea value (if any) using clipboard API
    if (textarea.value) {
      try {
        quill.clipboard.dangerouslyPasteHTML(textarea.value);
      } catch (e) {
        quill.root.innerHTML = textarea.value;
      }
    }

    // Sync quill -> hidden textarea so existing save/autosave logic continues to work
    quill.on('text-change', () => {
      textarea.value = quill.root.innerHTML;
      // dispatch input event so autosave hears it
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
} catch (e) {
  console.warn('Quill not available or failed to initialize', e);
}

// ---------- Autosave while typing ----------
const saveStatus = document.getElementById("saveStatus");
let autosaveTimer = null;
let autosaveDocId = null;

contentInput.addEventListener("input", () => {
  if (!currentUser) return; // Only autosave if signed in
  saveStatus.textContent = "Saving...";
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(autosaveDraft, 2000); // wait 2s after typing stops
});

async function autosaveDraft() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title && !content) return;

  try {
    if (autosaveDocId) {
      // Update existing draft
      await updateDoc(doc(db, "journal", autosaveDocId), {
        title,
        content,
        published: publishedInput.checked || false,
        updated_at: serverTimestamp()
      });
    } else {
      // Create new draft
      const docRef = await addDoc(journalCol, {
        title,
        content,
        published: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      autosaveDocId = docRef.id;
    }
    saveStatus.textContent = "Saved ✓";
    setTimeout(() => (saveStatus.textContent = ""), 3000);
  } catch (err) {
    console.error("Autosave error:", err);
    saveStatus.textContent = "Error saving 😥";
  }
}


let currentUser = null;
let editingDocId = null;

// ---------- Auth UI & handlers ----------
function showSignedOut() {
  authUi.innerHTML = `
        <form id="login-form" style="display:flex; gap:8px; align-items:center;">
          <input id="email" type="text" placeholder="email" style="padding:6px;border:1px solid #ddd;border-radius:6px;"/>
          <input id="password" type="password" placeholder="password" style="padding:6px;border:1px solid #ddd;border-radius:6px;"/>
          <button id="login-btn" type="button">Log in</button>
        </form>
        <div class="muted" style="margin-top:8px;">Only the owner can write entries.</div>
      `;
  document.getElementById("login-btn").onclick = async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      alert("Login failed: " + e.message);
    }
  };
  document.getElementById("signup-btn").onclick = async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert("Account created. Go to Firebase console and restrict rules by UID (see instructions).");
    } catch (e) {
      alert("Sign up failed: " + e.message);
    }
  };
}

function showSignedIn(user) {
  authUi.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center;">
          <div class="muted">Signed in as ${user.email}</div>
          <button id="logout-btn" class="small">Sign out</button>
        </div>
      `;
  document.getElementById("logout-btn").onclick = async () => {
    await signOut(auth);
  };
}

// ---------- Firestore reads ----------
async function loadPublicEntries() {
  entriesEl.innerHTML = "Loading...";
  const q = query(journalCol, where("published", "==", true), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) {
    entriesEl.innerHTML = "<div class='muted'>No public entries yet.</div>";
    return;
  }
  entriesEl.innerHTML = "";
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const el = document.createElement("div");
    el.className = "entry";
    el.innerHTML = `
  <a href="?id=${docSnap.id}" class="entry-link">
    <strong>${escapeHtml(d.title || "(no title)")}</strong>
  </a>
  <div class="meta">${new Date(d.created_at?.toDate?.() || Date.now()).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
      }</div>
  <div style="margin-top:8px;">${escapeHtml(d.description || "")}</div>
`;

    entriesEl.appendChild(el);
  });
}

async function loadAdminEntries() {
  if (!currentUser) return;
  adminEntriesEl.innerHTML = "Loading...";
  const q = query(journalCol, orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) {
    adminEntriesEl.innerHTML = "<div class='muted'>You have no entries yet.</div>";
    return;
  }
  adminEntriesEl.innerHTML = "";
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const id = docSnap.id;
    const wrapper = document.createElement("div");
    wrapper.className = "entry";
    wrapper.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>${escapeHtml(d.title || "(no title)")}</strong>
              <div class="meta">${new Date(d.created_at?.toDate?.() || Date.now()).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                              day: "numeric"
    })
      }</div>
            </div>
            <div style="text-align:right;">
              <label class="muted small" style="display:block;">
                <input type="checkbox" data-id="${id}" ${d.published ? "checked" : ""}/> Published
              </label>
              <div style="margin-top:8px;">
                <button data-edit="${id}" class="small">Edit</button>
                <button data-delete="${id}" class="small danger">Delete</button>
              </div>
            </div>
          </div>
        `;
    adminEntriesEl.appendChild(wrapper);
  });

  // Wire up edit/delete/publish toggles
  adminEntriesEl.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-edit");
      const dref = doc(db, "journal", id);
      const snapshot = await getDoc(dref);
      if (!snapshot.exists()) return alert("Not found");
      const data = snapshot.data();
      editingDocId = id;
      titleInput.value = data.title || "";
      descriptionInput.value = data.description || "";
      contentInput.value = data.content || "";
      if (quill) {
        try {
          quill.clipboard.dangerouslyPasteHTML(data.content || "");
        } catch (e) {
          quill.root.innerHTML = data.content || "";
        }
      }
      publishedInput.checked = !!data.published;
      saveBtn.style.display = "none";
      updateBtn.style.display = "inline-block";
      cancelEditBtn.style.display = "inline-block";
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    };
  });

  adminEntriesEl.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-delete");
      if (!confirm("Delete this entry?")) return;
      await deleteDoc(doc(db, "journal", id));
      await loadAdminEntries();
      await loadPublicEntries();
    };
  });

  adminEntriesEl.querySelectorAll("input[type='checkbox'][data-id]").forEach(chk => {
    chk.onchange = async () => {
      const id = chk.getAttribute("data-id");
      await updateDoc(doc(db, "journal", id), { published: chk.checked });
      await loadAdminEntries();
      await loadPublicEntries();
    };
  });
}

// ---------- Save / Update ----------
saveBtn.onclick = async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  await addDoc(journalCol, {
    title,
    description: descriptionInput.value.trim(),
    content,
    published: publishedInput.checked || false,
    created_at: serverTimestamp()
  });
  titleInput.value = "";
  contentInput.value = "";
  publishedInput.checked = false;
  await loadAdminEntries();
  await loadPublicEntries();
  alert("Saved");
};

updateBtn.onclick = async () => {
  if (!editingDocId) return;
  await updateDoc(doc(db, "journal", editingDocId), {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    content: contentInput.value.trim(),
    published: publishedInput.checked
  });
  editingDocId = null;
  saveBtn.style.display = "inline-block";
  updateBtn.style.display = "none";
  cancelEditBtn.style.display = "none";
  titleInput.value = "";
  contentInput.value = "";
  publishedInput.checked = false;
  await loadAdminEntries();
  await loadPublicEntries();
  alert("Updated");
};

cancelEditBtn.onclick = () => {
  editingDocId = null;
  saveBtn.style.display = "inline-block";
  updateBtn.style.display = "none";
  cancelEditBtn.style.display = "none";
  titleInput.value = "";
  contentInput.value = "";
  publishedInput.checked = false;
};

// ---------- Auth state observer ----------
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    showSignedIn(user);
    adminSection.style.display = "block";
    await loadAdminEntries();
  } else {
    showSignedOut();
    adminSection.style.display = "none";
  }
});

// Load public entries for everyone
await loadPublicEntries();

// Utility helpers
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function nl2br(str) {
  return str.replace(/\n/g, "<br>");
}


// ---------- Single-entry view ----------
const params = new URLSearchParams(window.location.search);
const entryId = params.get("id");

if (entryId) {
  // Viewing one entry
  document.getElementById("public-list").style.display = "none";
  const entryContainer = document.createElement("div");
  entryContainer.id = "single-entry";
  entryContainer.innerHTML = "<p>Loading entry...</p>";
  document.body.appendChild(entryContainer);

  const docRef = doc(db, "journal", entryId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const d = snap.data();
    entryContainer.innerHTML = `
      <h2>${escapeHtml(d.title || "(no title)")}</h2>
      <div class="meta">${new Date(d.created_at?.toDate?.() || Date.now()).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
      }</div>
      <div class="content">${d.content || ""}</div>
      <p><a href="/thoughts">← Back to all entries</a></p>
    `;
  } else {
    entryContainer.innerHTML = "<p>Entry not found.</p>";
  }
} else {
  // Normal list view
  await loadPublicEntries();
}


// ================= STATE MANAGEMENT =================
let employees = JSON.parse(localStorage.getItem("employees")) || [];
let editIndex = null;
let scanHistory = JSON.parse(localStorage.getItem("scanHistory")) || [];

// 14 Hours in milliseconds: 14 * 60 * 60 * 1000 = 50,400,000 ms
const EXPIRATION_TIME = 14 * 60 * 60 * 1000; 

// ================= AUDIO SYNTHESIZER FUNCTIONS =================
// 1. Success sound for Quick Punch Check-In
function playCheckInSound() {
    let sound = document.getElementById("successSound");
    if (sound) {
        sound.play().catch(() => playSynthTone(880, 0.15)); // Fallback synthesizer tone
    }
}

// 2. New sound when an Employee profile is Created/Saved
function playAddEmployeeSound() {
    playSynthTone(523.25, 0.1); // C5 note
    setTimeout(() => { playSynthTone(659.25, 0.15); }, 100); // E5 note (Cheerful double beep)
}

// 3. Soft tick sound when search filters active profiles
function playSearchMatchSound() {
    playSynthTone(1200, 0.03); // High pitch short crisp blip
}

// Universal browser tone generator function
function playSynthTone(freq, duration) {
    try {
        let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // keep volume comfortable
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.log("Audio contexts blocked by browser security rules until first user click.");
    }
}

// ================= AUTOMATIC 14-HOUR EXPIRATION CHECKER =================
function checkAttendanceExpiration() {
    let changed = false;
    const now = Date.now();

    employees.forEach(emp => {
        if (emp.attendance === "🟢 Active" && emp.checkInTime) {
            let timeElapsed = now - emp.checkInTime;
            
            if (timeElapsed >= EXPIRATION_TIME) {
                emp.attendance = "🔴 Absent";
                emp.checkInTime = null;
                changed = true;
                console.log(`⏰ 14 hours passed. Reset ${emp.name} to Absent.`);
            }
        }
    });

    if (changed) {
        saveData();
        renderEmployees();
    }
}

// ================= TOAST NOTIFICATIONS =================
function showToast(msg) {
    let toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerHTML = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// ================= PROCESSING ATTENDANCE UPDATE =================
function onScanSuccess(scannedId) {
    let employee = employees.find(emp => emp.id == scannedId);
    
    if (!employee) {
        showToast("❌ Employee ID Not Found");
        return;
    }

    employee.attendance = "🟢 Active";
    employee.checkInTime = Date.now(); 
    
    saveData();
    renderEmployees();
    playCheckInSound(); // Trigger Punch Sound

    showToast(`✅ ${employee.name} checked in successfully`);

    let scanResult = document.getElementById("scanResult");
    let scannerModal = document.getElementById("scannerModal");
    
    if (scanResult) {
        scanResult.innerHTML = `
        <div class="emp-popup">
            <div class="success-check" style="font-size:60px; color:#10b981;">✓</div>
            <img src="${employee.photo || 'https://i.pravatar.cc/150'}" alt="Profile" style="width:100px; height:100px; border-radius:50%; object-fit:cover; margin:15px auto; border:3px solid #10b981; display:block;">
            <h3 style="margin-top:10px;">${employee.name}</h3>
            <p style="color:#666; font-size:14px;">${employee.dept}</p>
            <p style="color: #10b981; font-weight: bold; margin-top: 8px; font-size:15px;">Status Marked: Active</p>
            <p style="font-size:11px; color:#94a3b8; margin-top:4px;">Resets to Absent automatically in 14 hours</p>
        </div>
        `;
    }
    if (scannerModal) scannerModal.style.display = "flex";

    scanHistory.unshift({
        id: employee.id,
        name: employee.name,
        dept: employee.dept,
        time: new Date().toLocaleString()
    });
    localStorage.setItem("scanHistory", JSON.stringify(scanHistory));
}

// ================= HANDLER FOR QUICK TERMINAL BUTTON PUNCH =================
function submitTerminalAttendance() {
    let inputField = document.getElementById("terminalIdInput");
    let inputtedId = inputField.value.trim();
    
    if (inputtedId) {
        onScanSuccess(inputtedId);
        inputField.value = "";
    } else {
        alert("Please key in or paste a valid Employee ID to update attendance.");
    }
}

// ================= MODAL WINDOW CONTROLS =================
function openModal() { document.getElementById("modal").style.display = "flex"; }
function closeModal() { document.getElementById("modal").style.display = "none"; resetForm(); }
function closeScanner() { document.getElementById("scannerModal").style.display = "none"; }

function resetForm() {
    document.getElementById("name").value = "";
    document.getElementById("dept").value = "";
    document.getElementById("salary").value = "";
    document.getElementById("photo").value = ""; 
    editIndex = null;
}
function saveData() { localStorage.setItem("employees", JSON.stringify(employees)); }

// ================= ADD AND UPDATE PROFILES =================
function addEmployee() {
    let name = document.getElementById("name").value.trim();
    let dept = document.getElementById("dept").value.trim();
    let salary = document.getElementById("salary").value;
    let fileInput = document.getElementById("photo");
    let file = fileInput.files ? fileInput.files[0] : null;

    if (!name || !dept || !salary) { alert("Please complete all the input fields"); return; }

    let reader = new FileReader();
    reader.onload = function (e) {
        let employee = {
            id: editIndex !== null ? employees[editIndex].id : String(Math.floor(100000 + Math.random() * 900000)),
            name: name,
            dept: dept,
            salary: salary,
            photo: file ? e.target.result : (editIndex !== null ? employees[editIndex].photo : ""),
            attendance: editIndex !== null ? employees[editIndex].attendance : "🔴 Absent",
            checkInTime: editIndex !== null ? employees[editIndex].checkInTime : null
        };

        if (editIndex !== null) { employees[editIndex] = employee; } 
        else { employees.push(employee); }

        saveData();
        renderEmployees();
        playAddEmployeeSound(); // Trigger Add Profile Sound chime
        closeModal();
    };

    if (file) { reader.readAsDataURL(file); } 
    else { reader.onload({ target: { result: editIndex !== null ? employees[editIndex].photo : "" } }); }
}

// ================= RENDERING DATA GRID =================
function renderEmployees() {
    let grid = document.getElementById("employeeGrid");
    if (!grid) return;
    grid.innerHTML = "";
    let totalSalary = 0;
    let deptSet = new Set();

    employees.forEach((emp, index) => {
        totalSalary += Number(emp.salary);
        deptSet.add(emp.dept);

        grid.innerHTML += `
        <div class="card">
            <img src="${emp.photo || 'https://i.pravatar.cc/150'}" alt="Profile">
            <h3>${emp.name}</h3>
            <p class="dept">${emp.dept}</p>
            <p>₹${Number(emp.salary).toLocaleString('en-IN')}</p>
            <p class="status-text">Status: <span>${emp.attendance}</span></p>
            <p style="font-weight: bold; font-size:14px; color:#2563eb; margin-top:12px; background:#f1f5f9; padding:6px 12px; border-radius:6px; display:inline-block;">ID: ${emp.id}</p>
            <div class="btns">
                <button class="edit" onclick="editEmployee(${index})">Edit</button>
                <button class="delete" onclick="deleteEmployee(${index})">Delete</button>
            </div>
        </div>
        `;
    });

    if(document.getElementById("employeeCount")) document.getElementById("employeeCount").innerText = employees.length;
    if(document.getElementById("departmentCount")) document.getElementById("departmentCount").innerText = deptSet.size;
    if(document.getElementById("salaryCount")) document.getElementById("salaryCount").innerText = totalSalary.toLocaleString('en-IN');

    let deptFilter = document.getElementById("deptFilter");
    if (deptFilter) {
        let selected = deptFilter.value;
        deptFilter.innerHTML = `<option value="">All Departments</option>`;
        deptSet.forEach(dept => { deptFilter.innerHTML += `<option value="${dept}">${dept}</option>`; });
        deptFilter.value = selected; 
    }
}

function deleteEmployee(index) {
    if (confirm("Permanently drop this record?")) { employees.splice(index, 1); saveData(); renderEmployees(); }
}

function editEmployee(index) {
    let emp = employees[index];
    document.getElementById("name").value = emp.name;
    document.getElementById("dept").value = emp.dept;
    document.getElementById("salary").value = emp.salary;
    editIndex = index;
    openModal();
}

// ================= LIVE FILTERS & LIVE SOUND TRIGGER =================
function filterEmployees() {
    let search = document.getElementById("search").value.toLowerCase();
    let department = document.getElementById("deptFilter").value;
    let foundActiveMatch = false;

    document.querySelectorAll(".grid .card").forEach(card => {
        let text = card.innerText.toLowerCase();
        let dept = card.querySelector(".dept").innerText;
        let isStatusActive = card.querySelector(".status-text span").innerText.includes("Active");

        if (text.includes(search) && (department === "" || dept === department)) {
            card.style.display = "block";
            // If the filter specifically matches an employee that is currently ACTIVE, flag true
            if (search.length > 0 && isStatusActive) {
                foundActiveMatch = true;
            }
        } else {
            card.style.display = "none";
        }
    });

    // Play a distinct high blip tick sound dynamically if an active user card pops into view!
    if (foundActiveMatch) {
        playSearchMatchSound();
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

window.onclick = function (e) {
    if (e.target === document.getElementById("modal")) closeModal();
    if (e.target === document.getElementById("scannerModal")) closeScanner();
};

document.addEventListener("DOMContentLoaded", () => { 
    renderEmployees(); 
    checkAttendanceExpiration();
    setInterval(checkAttendanceExpiration, 60000);
});
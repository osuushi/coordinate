let id
let userName
let room = {
  users: {},
  statuses: {},
}

const audio = new Audio('/sound.mp3')

if (localStorage.id == null) {
  id = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  localStorage.id = id
} else {
  id = localStorage.id
}

if (localStorage.name != null) {
  userName = localStorage.name
  document.getElementById("name").value = userName
}

document.getElementById("url").value = window.location.href
// Populate the qr code
new QRCode(document.getElementById("qrcode"), window.location.href)

const start = () => {
  audio.load()
  userName = document.getElementById("name").value
  localStorage.name = userName
  document.getElementById("main").innerHTML = `
    <div id="status"></div>
    <hr>
    <div id="self">
      <div>
        <button onclick="setReady()" id="ready">I'm Ready!</button>
      </div>
      <div>
        <button onclick="resetRoom()">Reset Room</button>
      </div>
      <label> Name: <input type="text" id="name" placeholder="Enter Name" oninput="editUser()"></label>
    </div>
  `
  document.getElementById("name").value = userName

  room.users[id] = {
    value: userName,
    timestamp: Date.now(),
  }
  room.statuses[id] = {
    value: false,
    timestamp: Date.now(),
  }
  loop()
}

// POST the current room to the server, then apply LWW on the result to update the room
const update = async () => {
  try {
    const response = await fetch(window.location.href, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(room),
    })
    const newRoom = await response.json()
    let wasAlready = isAllReady()
    applyLWW(newRoom)
    playSoundIfNeeded(wasAlready)
  } catch { }
}

// Apply LWW to merge rooms, adding any users that are not in the current room
const applyLWW = (newRoom) => {
  for (let id in newRoom.users) {
    if (room.users[id] == null) {
      room.users[id] = newRoom.users[id]
    } else if (newRoom.users[id].timestamp > room.users[id].timestamp) {
      room.users[id] = newRoom.users[id]
    }
  }
  for (let id in newRoom.statuses) {
    if (room.statuses[id] == null) {
      room.statuses[id] = newRoom.statuses[id]
    } else if (newRoom.statuses[id].timestamp > room.statuses[id].timestamp) {
      room.statuses[id] = newRoom.statuses[id]
    }
  }
}

const editUser = () => {
  room.users[id].value = document.getElementById("name").value
  room.users[id].timestamp = Date.now()
}

// Loop, polling with updates and rendering
const loop = async () => {
  await update()
  render()
  setTimeout(loop, 1000)
}

const isAllReady = () => {
  let allReady = true
  for (let id in room.statuses) {
    if (!room.statuses[id].value) {
      allReady = false
    }
  }
  return allReady
}

// Render the current state of the room
const render = () => {
  let statuses = []
  for (let id in room.statuses) {
    let name = room.users[id].value
    let status = room.statuses[id].value
    statuses.push({name, status})
  }
  statuses.sort((a, b) => a.name.localeCompare(b.name))

  let rows = []
  for (let {name, status} of statuses) {
    let icon = status ? "✅" : "❌"
    let el = document.createElement("div")
    el.style.fontSize = "2em"
    el.textContent = `${icon} ${name}`
    rows.push(el)
  }
  document.getElementById("status").innerHTML = isAllReady() ? "<h1>All Ready!</h1>" : "<h1>Waiting for others...</h1>"
  document.getElementById("status").append(...rows)

  // Update the ready button
  if (room.statuses[id].value) {
    document.getElementById("ready").innerHTML = "Oops, I'm Not Ready!"
  } else {
    document.getElementById("ready").innerHTML = "I'm Ready!"
  }
}

const setReady = function () {
  room.statuses[id].value = !room.statuses[id].value
  room.statuses[id].timestamp = Date.now()
  render()
}

const resetRoom = function () {
  for (let id in room.statuses) {
    room.statuses[id].value = false
    room.statuses[id].timestamp = Date.now()
  }
  render()
}

const playSound = () => {
  let instance = audio.cloneNode()
  instance.play()
}

// Play the sound if:
// 1. This user was first to set ready this time
// 2. Was not previously ready
// 3. Is now ready
const playSoundIfNeeded = (wasAlready) => {
  // Only play the sound if transitioned to ready
  if (wasAlready || !isAllReady()) return
  // Check if this was the first user to set ready
  let myTimestamp = room.statuses[id].timestamp
  let first = true
  for (let id in room.statuses) {
    if (room.statuses[id].timestamp < myTimestamp) {
      first = false
      break
    }
  }
  if (first) {
    playSound()
  }
}
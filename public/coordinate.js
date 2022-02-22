let id
let userName
let room = {
  users: {},
  statuses: {},
}

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

const start = () => {
  userName = document.getElementById("name").value
  localStorage.name = userName
  document.getElementById("main").innerHTML = `
    <div id="status"></div>
    <div id="self">
      <div>
        <button onclick="setReady()" id="ready">I'm Ready!</button>
      </div>
      <div>
        <button onclick="resetRoom()">Reset Room</button>
      </div>
      <input type="text" id="name" placeholder="Enter Name" oninput="editUser()">
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
    applyLWW(newRoom)
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

// Render the current state of the room
const render = () => {
  statuses = []
  let allReady = true
  for (let id in room.statuses) {
    let name = room.users[id].value
    let status = room.statuses[id].value
    statuses.push({name, status})
    if (!status) {
      allReady = false
    }
  }
  statuses.sort((a, b) => a.name.localeCompare(b.name))

  let rows = []
  for (let {name, status} of statuses) {
    let icon = status ? "✅" : "❌"
    let el = document.createElement("div")
    el.textContent = `${icon} ${name}`
    rows.push(el)  
  }
  document.getElementById("status").innerHTML = allReady ? "<h1>All Ready!</h1>" : "<h1>Waiting for others...</h1>"
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
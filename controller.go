package main

var rooms = make(map[string]*Room)

func HandleRoomUpdate(id string, update *Room) *Room {
	if _, ok := rooms[id]; !ok {
		rooms[id] = NewRoom()
	}
	rooms[id].MergeRoom(update)
	return rooms[id]
}

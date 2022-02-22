package main

type Room struct {
	Users    map[string]*LwwString `json:"users"`    // maps user ids to display names
	Statuses map[string]*LwwBool   `json:"statuses"` // maps user ids to statuses
}

type Lww interface {
	// Merge the value of the other Lww into this Lww.
	Merge(other Lww)
}

type LwwBool struct {
	Value     bool  `json:"value"`
	Timestamp int64 `json:"timestamp"`
}

type LwwString struct {
	Value     string `json:"value"`
	Timestamp int64  `json:"timestamp"`
}

func (x *LwwBool) Merge(yLww Lww) {
	y, ok := yLww.(*LwwBool)
	if !ok {
		panic("LwwBool.Merge: type mismatch")
	}
	if x.Timestamp < y.Timestamp {
		x.Value = y.Value
		x.Timestamp = y.Timestamp
	}
}

func (x *LwwString) Merge(yLww Lww) {
	y, ok := yLww.(*LwwString)
	if !ok {
		panic("LwwString.Merge: type mismatch")
	}
	if x.Timestamp < y.Timestamp {
		x.Value = y.Value
		x.Timestamp = y.Timestamp
	}
}

func NewRoom() *Room {
	return &Room{
		Users:    make(map[string]*LwwString),
		Statuses: make(map[string]*LwwBool),
	}
}

// Apply an update by using the LWW rule.
// - The room ID is immutable
// - Any user ids missing from either room are added
// - User names and statuses are updated according to LWW
func (r *Room) MergeRoom(update *Room) {
	for id, name := range update.Users {
		if _, ok := r.Users[id]; !ok {
			r.Users[id] = &LwwString{}
		}
		r.Users[id].Merge(name)
	}
	for id, status := range update.Statuses {
		if _, ok := r.Statuses[id]; !ok {
			r.Statuses[id] = &LwwBool{}
		}
		r.Statuses[id].Merge(status)
	}
}

package main

import (
	_ "embed"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strconv"
)

//go:embed public/index.html
var indexHtml string

//go:embed public/room.html
var roomHtml string

//go:embed public/coordinate.js
var coordinateJs string

//go:embed public/sound.mp3
var soundMp3 []byte

func main() {
	port := 1234
	if len(os.Args) > 1 {
		port, _ = strconv.Atoi(os.Args[1])
	}
	http.HandleFunc("/", handleRoot)
	http.HandleFunc("/room/", handleRoom)
	http.HandleFunc("/coordinate.js", handleJs)
	http.HandleFunc("/sound.mp3", handleSound)
	http.ListenAndServe(":"+strconv.Itoa(port), nil)
}

// Statically serve the root index.html
func handleRoot(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(indexHtml))
}

// GET on the room URL returns the static HTML. POST returns the JSON for the
// room
func handleRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		w.Write([]byte(roomHtml))
	} else if r.Method == "POST" {
		// Parse the id from the URL
		roomId := r.URL.Path[len("/room/"):]
		if len(roomId) < 8 || len(roomId) > 32 {
			http.Error(w, "Invalid room id", http.StatusBadRequest)
		}

		// Parse the room data from the body
		room := &Room{}
		if err := json.NewDecoder(io.LimitReader(r.Body, 4096)).Decode(room); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		// Hand off to the controller
		result := HandleRoomUpdate(roomId, room)
		// Return the result
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(result); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func handleJs(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(coordinateJs))
}

func handleSound(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "audio/mpeg")
	// This can be cached aggressively
	w.Header().Set("Cache-Control", "public, max-age=31536000")
	w.Write(soundMp3)
}

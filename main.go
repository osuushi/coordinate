package main

import (
	_ "embed"
	"encoding/json"
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

func main() {
	port := 1234
	if len(os.Args) > 1 {
		port, _ = strconv.Atoi(os.Args[1])
	}
	http.HandleFunc("/", handleRoot)
	http.HandleFunc("/room/", handleRoom)
	http.HandleFunc("/coordinate.js", handleJs)
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
		// Parse the room data from the body
		room := &Room{}
		if err := json.NewDecoder(r.Body).Decode(room); err != nil {
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

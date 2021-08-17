




class EYE extends HTMLElement {
  connectedCallback(){
    /*
      Gets the target-id
    */    


    this.peer = new Peer()

    this.innerHTML = '<i>Initializing peer component</i>'

    this.peer.on('open', (id) => {
      this.target_id = this.getAttribute('target-id')
      if(this.target_id === null){
        const route = window.location.href + `?&target-id=${id}`
        this.QR_CODE = document.createElement('qr-code')
        this.QR_CODE.setAttribute('value', route)

        this.appendChild(this.QR_CODE)

        this.peer.on('connection', (conn) => {
          this.connection = conn

          this.QR_CODE.remove()
          this.innerHTML = 'peered to ' + conn.peer

          this.map = document.createElement('geo-map')
          this.map.setAttribute('accesstoken', 'pk.eyJ1IjoibGluZHNleW15c3NlIiwiYSI6ImNqOGNlYjMzbDA5am8zMmxid2oyc3hrc2cifQ.hK6NXKEl7bK7va2pRtY0Yw')
          this.map.setAttribute('styleurl', 'mapbox://styles/lindseymysse/cjcqx0yoi5l6c2ro9kxheop6d')
          this.map.style.zIndex = -100
          this.map.setAttribute('pitch', '45')
          document.body.appendChild(this.map)
          this.connection.on('data', (data) => {
            dispatch('UPDATE-MAP', data)
          })
        })

        this.peer.on('call', (call) => {
          call.answer(); // Answer the call with an A/V stream.
          call.on('stream', (remoteStream) => {
            const new_vid =  document.createElement('video')
            new_vid.setAttribute('mute', true)
            this.prepend(new_vid)
            new_vid.srcObject = remoteStream
            new_vid.play()
          })
        })

      } else {
        // if there is an id
        const connection = this.peer.connect(this.target_id)
        setInterval(()=>{navigator.geolocation.getCurrentPosition((new_pos) => {
          const new_pos_message = {
            type:'new-pos-message',
            data: {
              latitude: new_pos.coords.latitude,
              longitude: new_pos.coords.longitude,
              timestamp: new_pos.timestamp
            }
          }
          connection.send(new_pos_message)
        })},1000)


        navigator.getUserMedia({video: true, audio: true}, (stream) => {
          const call = this.peer.call(this.target_id, stream)
        }, function(err) {
          console.log('Failed to get local stream' ,err)
        })
      }
    })



  }

  static get observedAttributes() {
    return [];
  }

  handleInputChange(){

  }

  handleTextAreaChange(){

  }

  handleCanvas(canvas){

  }

  handleImage(img){

  }

  handleVideo(video){

  }

  handleAudio(audio){

  }

  update(value){
    if(!this.connection) return
    this.connection.send(value)

    // send new HTML to all peers
  }

  attributeChangedCallback(name, old_value, new_value){
    switch(name){
      default:
    }
  }

}

customElements.define('e-y-e', EYE)



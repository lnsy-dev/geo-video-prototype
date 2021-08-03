

import { dispatch } from './helpers.js'


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

        if(window.location.host.split(':')[0] === 'localhost'){
          console.log('localhost')
        }

        const route = window.location.origin + '/ar1adn3/eye-test.html' + `?&target-id=${id}`
        this.QR_CODE = document.createElement('qr-code')
        this.QR_CODE.setAttribute('value', route)

        this.appendChild(this.QR_CODE)
      } else {

        navigator.getUserMedia({video: true, audio: true}, (stream) => {
          const call = this.peer.call(this.target_id, stream)
          call.on('stream', function(remoteStream) {
            // Show stream in some video/canvas element.
          })
        }, function(err) {
          console.log('Failed to get local stream' ,err)
        })


      }
    })

    this.peer.on('connection', (conn) => {
      this.connection = conn
      this.innerHTML = '<i>connected to peer</i>'

      dispatch('SAVE-TO-PEERS')
      this.connection.on('data', (data) => {
        this.innerHTML = data
        dispatch('DATA-RECEIVED', data)
      })
      this.QR_CODE.remove()
      this.innerHTML = 'peered to ' + conn.peer
    })

    this.peer.on('call', (call) => {
      navigator.getUserMedia({video: true, audio: true}, (stream) => {
        call.answer(stream); // Answer the call with an A/V stream.
        call.on('stream', (remoteStream) => {
          const new_vid =  document.createElement('video')
          new_vid.setAttribute('mute', true)
          this.prepend(new_vid)
          new_vid.srcObject = remoteStream
          new_vid.play()

          // Show stream in some video/canvas element.
        })
      }, function(err) {
        console.log('Failed to get local stream' ,err);
      })
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



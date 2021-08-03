import { dispatch } from './helpers.js'





class ConfirmButton extends HTMLElement {
  connectedCallback(){
    this.innerHTML = '<button>confirm peer</button>'
    this.addEventListener('click', (e) => {
      this.innerHTML = 'Waiting for Save from Editor'
    })
  }

  static get observedAttributes() {
    return [];
  }

  attributeChangedCallback(name, old_value, new_value){
    switch(name){
      default:
    }
  }

}

customElements.define('confirm-button', ConfirmButton)





class PeerComponent extends HTMLElement {
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

        const route = window.location.origin + '/host.html' + `?&target-id=${id}`
        this.QR_CODE = document.createElement('qr-code')
        this.QR_CODE.setAttribute('value', route)

        this.appendChild(this.QR_CODE)
      } else {
        this.innerHTML = '<i>connecting to peer</i>'

        this.connection = this.peer.connect(this.target_id)

        // let baseLogFunction = console.log
        // // console.log = function(){
        // //   baseLogFunction.apply(console, arguments)
        // //   var args = Array.prototype.slice.call(arguments)
        // //   for(var i=0;i<args.length;i++){
        // //     this.connection.send(b64.encode(args[i]))
        // //   }   
        // // }

        this.innerHTML = `
          <confirm-button></confirm-button>
        `
        this.connection.on('data', (data) => {
          this.innerHTML = b64.decode(data)
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

customElements.define('peer-component', PeerComponent)



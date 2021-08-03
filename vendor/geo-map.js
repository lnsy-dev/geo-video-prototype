/*

    **** BEGIN ASCII ART ****

       ________________        __  ______    ____
      / ____/ ____/ __ \      /  |/  /   |  / __ \
     / / __/ __/ / / / /_____/ /|_/ / /| | / /_/ /
    / /_/ / /___/ /_/ /_____/ /  / / ___ |/ ____/
    \____/_____/\____/     /_/  /_/_/  |_/_/


    **** END ASCII ART ****

    Markup Based Map as a pure Web Component

*/

/*
  
  ROUTING
  
  Get and Set URL

*/

function getURLValues(URL = window.location.href ){
  const search_params = new URLSearchParams(URL)
  let options = {}
  for (const [key, unparsed_value] of search_params) {
    if(key !== window.location.origin + window.location.pathname + '?' ){
      try {
        const value = JSON.parse(decodeURI(unparsed_value))
        options[key] = value
      } catch {
        options[key] = decodeURI(unparsed_value)
      }
    }
  }
  return options
}

function setURLValues(obj){
  let url = window.location.origin + window.location.pathname + '?'
  Object.keys(obj).forEach(key => {
    url += `&${key}=${obj[key]}`
  })
  history.pushState(obj, '', url)
}

/*
    
    Get Attribute

    Gets all attributes of an object,
    returns an object
    
*/

function getAttributes(el){
  let obj = {}
  for (let att, i = 0, atts = el.attributes, n = atts.length; i < n; i++){
    att = atts[i]
    obj[att.nodeName] = att.nodeValue
  }
  return obj
}


function ready(callbackFunction){
  if(document.readyState != 'loading')
    callbackFunction(event)
  else
    document.addEventListener("DOMContentLoaded", callbackFunction)
}



class GeoMap extends HTMLElement {

  connectedCallback(){
    if(typeof(mapboxgl) === 'undefined'){
      this.innerHTML = '<error>STORY MAP REQUIRES MAPBOXGL TO WORK: https://docs.mapbox.com/mapbox-gl-js/api/</error>'
    }
    const URLvalues = getURLValues()
  
    this.access_token = this.getAttribute('accesstoken')
    if(this.access_token === null){
      const access_token_error = `
        Error: Story Map requires a Mapbox access token. 
        Please consult the readme for more information`
      this.innerHTML = `<error> ${access_token_error} </error>`
      return new Error(access_token_error)
    }
    this.removeAttribute('accesstoken')
    mapboxgl.accessToken = this.access_token

    this.latitude = URLvalues.latitude ? URLvalues.latitude : 0
    this.longitude = URLvalues.longitude ? URLvalues.longitude : 0
    this.zoom = URLvalues.zoom ? URLvalues.zoom : 1
    this.bearing = URLvalues.bearing ? URLvalues.bearing : 0
    this.pitch = URLvalues.pitch ? URLvalues.pitch : 0
    this.home_coord = {
      center:[this.longitude, this.latitude],
      zoom:this.zoom,
      pitch: this.pitch,
      bearing: this.bearing
    }
    this.styleurl = this.getAttribute('styleurl')
    if(this.styleurl === null || this.styleurl === ""){
      console.warn('could not find style url, using the default')
      this.styleurl = 'mapbox://styles/mapbox/streets-v11'
    }
    this.removeAttribute('styleurl')

      const el = document.createElement('div')
    el.classList.add('map-container')
    this.appendChild(el)
    this.map = new mapboxgl.Map({
      container: el, // container ID
      style: this.styleurl, // style URL
      center: [this.longitude, this.latitude],
      zoom: this.zoom,
      bearing: this.bearing,
      pitch: this.pitch,
      style: this.styleurl,
    })

    this.map.on('load', () => {this.mapLoaded()})

    this.geocoder = this.getAttribute('geocoder')
    if(this.geocoder !== null){   
      if(typeof(MapboxGeocoder) === 'undefined'){
        this.innerHTML = `If you would like to use the geocoder element, 
        you must include the geocoder plugin in your HTML: 
        https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-geocoder/`
        return
      } 
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        zoom: 18,
        marker: false,
        placeholder: 'Search for an Address'
      })
      geocoder.on('result', (e) => { this.geocoderResult(e) })
      this.map.addControl( geocoder )
    } // end GeoCoder

    this.navigation_control = this.getAttribute('navigation')
    if(this.navigation_control !== null){
      this.map.addControl(
        new mapboxgl.NavigationControl({visualizePitch: true})
      )
    }

    this.geolocate = this.getAttribute('geolocate')
    if(this.geolocate !== null){
      this.map.addControl(new mapboxgl.GeolocateControl({
        showAccuracy: false,
        showUserLocation: false
      }))
    }

    this.edit_mode = this.getAttribute('edit')
    if(this.edit_mode !== null){
      this.map.addControl(new EditController(this.map))
    }
    setInterval(()=>{this.checkForDOMUpdates()},50)

    this.observer = new IntersectionObserver((e) => {
      this.handleScrollIntoView(e)}, {
        root:null,
        rootMargin: '0px'
      })
  }

  handleScrollIntoView(e){
    this.map.flyTo({
      center:[e[0].target.longitude, e[0].target.latitude]
    })

  }

  async checkForDOMUpdates(){
    const query = this.querySelectorAll('map-location')
    if(query.length !== this.storyLocationCount){
      this.cursor = 'wait'
      this.storyLocationCount = query.length
      await [...query].forEach(location => { const addedMarkers = this.addLocation(location) })
      this.cursor = ''
    }
  }

  addLocation(location){
    const center = [location.longitude, location.latitude]

    this.observer.observe(location)

    let markers = [...location.querySelectorAll('map-marker')]

    if(markers.length > 0){
      markers = markers.map(marker => {

        let rotation_alignment = marker.getAttribute('rotation-alignment')
        if(rotation_alignment === null){
          rotation_alignment = 'viewport'
        }

        return new mapboxgl.Marker({
          draggable:false,
          scale:0,
          rotationAlignment: rotation_alignment,
          element: marker
        }).setLngLat(center)
          .addTo(this.map)
      })
    } else {
      markers[0] = new mapboxgl.Marker({
        draggable: false,
        rotationAlignment: 'viewport',
        scale: 1,
      }).setLngLat(center)
      .addTo(this.map)
    }

    markers.forEach(marker => {
      marker.getElement().addEventListener('click', (e)=> {
        this.scroll(0, location.offsetTop)
        e.stopPropagation()
        this.map.flyTo({
          center,
          zoom: location.zoom,
          bearing: location.bearing,
          pitch: location.pitch
        })

      })
    })
  }


  mapLoaded(){
    this.map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    })
    this.map.setTerrain({ 'source': 'mapbox-dem' })      

    this.map.on('moveend', (e) => {
      let center  = this.map.getCenter()
      this.longitude = center.lng
      this.latitude = center.lat
      this.zoom = this.map.getZoom()
      this.bearing = this.map.getBearing()
      this.pitch = this.map.getPitch()

      setURLValues({
        latitude: this.latitude, 
        longitude: this.longitude,
        zoom: this.zoom,
        bearing: this.bearing, 
        pitch: this.pitch,
      })
    })//end moveend
  }

  geocoderResult(){
    this.map.once('moveend', async (e) => {
      console.log(e)
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

customElements.define('geo-map', GeoMap)






class MapLocation extends HTMLElement {
  connectedCallback(){
    this.latitude = this.getAttribute('latitude')
    if(this.latitude === null){
      const latitude_error = `
        Error: Story Locations require a latitude value. 
        Please consult the readme for more information`
      this.innerHTML = `<error> ${latitude_error} </error>`
      return new Error(latitude_error)
    }

    this.longitude = this.getAttribute('longitude')
    if(this.longitude === null){
      const longitude_error = `
      Error: Story Locations require a longitude value. 
        Please consult the readme for more information`
      this.innerHTML = `<error> ${longitude_error} </error>`
      return new Error(longitude_error)
    }

    this.zoom = this.getAttribute('zoom')
    if(this.zoom === null){
      const zoom_error = `Error: Story Locations require a zoom value. 
        Please consult the readme for more information`
      this.innerHTML = `<error> ${zoom_error} </error>`
      return new Error(zoom_error)
    }

    this.bearing = this.getAttribute('bearing')
    if(this.bearing === null || this.bearing === ""){
      console.warn('Could not find bearings, using the default')
      this.bearing = 80
    }

    this.pitch = this.getAttribute('pitch')
    if(this.pitch === null || this.pitch === ""){
      console.warn('Could not find pitch, using the default')
      this.pitch = 60
    }

    this.duration = this.getAttribute('duration')

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

customElements.define('map-location', MapLocation)


class EditController {
  onAdd(map) {

    this.map = map
    this._container = document.createElement('button')
    this._container.className = 'mapboxgl-ctrl'
    this._container.innerHTML = `<svg height='20px' width='20px'  fill="#000000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><g><path d="M80.4,5.5h-2.8L66.8,16.3l17,17l10.8-10.8v-2.8L80.4,5.5z M12.8,70.3L5,95l24.7-7.8l47-47l-17-17L12.8,70.3z"></path></g></g></svg>`
    this._container.addEventListener('click', (e) => this.handleClick(e))
    return this._container;
  }

  handleClick(e){
    const center = this.map.getCenter()
    const new_story_location_markup = 

      `<story-location
        latitude="${center.lat}"
        longitude="${center.lng}"
        zoom=0
        pitch=0
        bearing=0
        title=""
      >
      </story-location>`

    // @todo  
    const new_story_location_geojson = JSON.stringify({
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Point",
            "coordinates":[center.lng, center.lat]
          }
        }
      ]
    })

    console.log(new_story_location_markup, new_story_location_geojson)
  }
 
  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

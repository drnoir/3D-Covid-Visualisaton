import {
  EffectComposer,
  BloomEffect,
  SMAAEffect,
  RenderPass,
  EffectPass
} from 'postprocessing'
import { WebGLRenderer, Scene, PerspectiveCamera, PointLight } from 'three'
import * as THREE from 'three';
import OrbitControls from './controls/OrbitControls'
import { preloader } from './loader'
import { TextureResolver } from './loader/resolvers/TextureResolver'
import { ImageResolver } from './loader/resolvers/ImageResolver'
import { GLTFResolver } from './loader/resolvers/GLTFResolver'

/* Custom settings */
const SETTINGS = {
  useComposer: true
}
let composer
let stats

/* Init renderer and canvas */
const container = document.body
const renderer = new WebGLRenderer()
container.style.overflow = 'hidden'
container.style.margin = 0
container.appendChild(renderer.domElement)
renderer.setClearColor(0x3d3b33)

/* Main scene and camera */
const scene = new Scene()
const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
const controls = new OrbitControls(camera)
camera.position.z = 10
controls.enableDamping = true
controls.dampingFactor = 0.15
controls.start()

/* Lights */
const frontLight = new PointLight(0xFFFFFF, 1)
const backLight = new PointLight(0xFFFFFF, 1)
scene.add(frontLight)
scene.add(backLight)
frontLight.position.set(20, 20, 20)
backLight.position.set(-20, -20, 20)

/* Various event listeners */
window.addEventListener('resize', onResize)

/* Preloader */
preloader.init(new ImageResolver(), new GLTFResolver(), new TextureResolver())
preloader.load([
  { id: 'searchImage', type: 'image', url: SMAAEffect.searchImageDataURL },
  { id: 'areaImage', type: 'image', url: SMAAEffect.areaImageDataURL },

]).then(() => {
  initPostProcessing()
  onResize()

  animate()

  const axios = require("axios");


  const endpoint = (
      'https://api.coronavirus.data.gov.uk/v1/data?' +
      'filters=areaType=nation;areaName=england&' +
      'structure={"date":"date","newCases":"newCasesByPublishDate"}'
  );


  const getData = async ( url ) => {

    const { data, status, statusText } = await axios.get(url, { timeout: 10000 });

    if ( status >= 400 )
      throw new Error(statusText);

    return data

  };  // getData

  const mainResults = async () => {
    const result = await getData(endpoint);
    console.log(result.data);
    const resultLength = result.data.length;
    const todayIndx =resultLength-1;
    let todayData = result.data[0].newCases;
    let todayDate = result.data[0].date;
    console.log(resultLength, todayIndx, todayData);
    let points = [];
    for ( let i = 0; i <todayData / 100  ; i ++ ) {

      let randX = Math.random() * 2 - 1;
      let randY = Math.random() * 2 - 1;
      let randZ = Math.random() * 2 - 1;
      let particle = new THREE.Sprite( material );
      particle.position.x = randX;
      particle.position.y = randY;
      particle.position.z = randZ;

      particle.position.normalize();
      particle.position.multiplyScalar( Math.random() * 20 + 250);
      particle.scale.x = particle.scale.y = 5;
      particle.scale.y = particle.scale.y = 5;
      particle.scale.z = particle.scale.z = 5;
      scene.add( particle);
      points.push( particle.position );

      const material = new THREE.LineBasicMaterial({
        color: 'red'
      });

      // lines
      let geometry = new THREE.BufferGeometry().setFromPoints( points );
      // let textMap = new THREE.TextBufferGeometry("hello world", geometry, new THREE.TextBufferGeometry( { color: 0xffffff, opacity: 0.8 } ) );

      // let textMap = new THREE.TextGeometry( "Hello World", { color: 0xffffff, opacity: 0.8 } );
      let line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.8 } ) );
      scene.add( line );

      camera.position.z = 500;
    }

    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    const cases = document.createElement ('div');
    cases.style.position = 'absolute';
    cases.style.color = 'white';
    cases.style.background = 'black';
    cases.style.top = '0';
    cases.style.fontSize = "1.2em";
    cases.style.fontFamily = "Verdana";
    cases.style.textAlign = 'center';
    cases.style.width = '100%';
    cases.style.margin = '0 auto';
    cases.style.opacity = '0.8';
    cases.innerHTML =
        "<h3>Three JS Covid Cases 3D Visualisation</h3>"+
        "<p>New Covid Cases England "+todayDate+"</p>"
        + "<div class ='timerSec'><p>"+todayData+"</p>"
        +"<p> Data Source : gov.uk</p>"
    container.appendChild(cases);

  };  // main

  mainResults().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });


})

/* some stuff with gui */
if (DEVELOPMENT) {
  const guigui = require('guigui')
  guigui.add(SETTINGS, 'useComposer')

  const Stats = require('stats.js')
  stats = new Stats()
  stats.showPanel(0)
  container.appendChild(stats.domElement)
  stats.domElement.style.position = 'absolute'
  stats.domElement.style.top = 0
  stats.domElement.style.left = 0
}

/* -------------------------------------------------------------------------------- */
function initPostProcessing () {
  composer = new EffectComposer(renderer)
  const bloomEffect = new BloomEffect()
  const smaaEffect = new SMAAEffect(preloader.get('searchImage'), preloader.get('areaImage'))
  const effectPass = new EffectPass(camera, smaaEffect, bloomEffect)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)
  composer.addPass(effectPass)
  effectPass.renderToScreen = true
}

/**
  Resize canvas
*/
function onResize () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}

/**
  RAF
*/
function animate() {
  window.requestAnimationFrame(animate)

  render()
}

/**
  Render loop
*/
function render () {
  if (DEVELOPMENT) {
    stats.begin()
  }

  controls.update()
  if (SETTINGS.useComposer) {
    composer.render()
  } else {
    renderer.clear()
    renderer.render(scene, camera)
  }

  if (DEVELOPMENT) {
    stats.end()
  }
}

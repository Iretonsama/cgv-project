import * as THREE from "three";
import Maze from "./lib/MazeGenerator";
import PlayerController from "./PlayerController.js";
import Monster from "./Monster.js";
// import minimap from "./minimap.js";
import MiniMap from "./MiniMapHandler";
import WallGenerator from "./WallGenerator.js";
// import GraphNode from "./pathfinder/PathGraph";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";
import Physics from "./Physics.js";
import Constants from "./Constants";

let playerController, scene, renderer, physicsWorld, mMap, maze, grid, monster;
let pathGraph = [];
const blockiness = 1;
// const mapSize = 7;

let rigidBodies = [],
  tmpTrans;

const clock = new THREE.Clock();

class GameManager {
  async init() {
    maze = new Maze(Constants.MAP_SIZE, Constants.MAP_SIZE);
    maze.growingTree();
    grid = maze.getThickGrid();

    // initializing physics
    await Ammo();

    tmpTrans = new Ammo.btTransform();

    initGraphics();
    initWorld();

    window.addEventListener("resize", onWindowResize, true);

    animate();
  }
}

function initGraphics() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(
    innerWidth / Constants.BLOCKINESS,
    innerHeight / Constants.BLOCKINESS
  );
  renderer.domElement.style.width = innerWidth;
  renderer.domElement.style.height = innerHeight;
  renderer.shadowMap.enabled = true;

  document.body.appendChild(renderer.domElement);

}

function animate() {
  let deltaTime = clock.getDelta();
  requestAnimationFrame(animate);
  playerController.update();
  if (monster.path != "") monster.update(scene);

  mMap.worldUpdate();
  render();
}

function initWorld() {
  renderMaze(); // adds the maze in to the scene graph

  // set up the floor of the game
  const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x505050,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotateX(-Math.PI / 2);
  floor.position.y = -20 / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // adds the ambient light into scene graph
  const light = new THREE.AmbientLight(0xbbbbbb); // 0x080808
  scene.add(light);

  playerController = new PlayerController(-30, 0, 20, renderer.domElement);
  scene.add(playerController.controls.getObject());

  let monsterPosition = {
    x: (2 * Constants.MAP_SIZE - 1) * Constants.WALL_SIZE,
    y: 0,
    z: (2 * Constants.MAP_SIZE - 1) * Constants.WALL_SIZE,
  };
  monster = new Monster(monsterPosition, Constants.MONSTER_SPEED_INVERSE);
  monster.getAstarPath(grid, {
    x: 1 * Constants.WALL_SIZE,
    y: 0,
    z: 1 * Constants.WALL_SIZE,
  });
  // console.log(monster.path);
  scene.add(monster.monsterObject);

  mMap = new MiniMap(playerController, grid);
}

function renderMaze() {
  // grid[maze.getThickIndex(0, 1)] = false;
  // grid[maze.getThickIndex(2 * maze.width - 1, 2 * maze.height)] = false;

  grid[1][0] = false;
  grid[2 * maze.width - 1][2 * maze.height] = false;

  const wallGenerator = new WallGenerator();

  // const wallHeight = 0.2 * Constants.WALL_SIZE;
  // const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  // var geometryArr = [];
  // var wallRes = 5;

  const mazeGroup = new THREE.Group();

  for (var y = 0; y < 2 * maze.height + 1; y++) {
    for (var x = 0; x < 2 * maze.width + 1; x++) {
      if (grid[y][x]) {
        //var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        var wallMesh;

        let binString = wallGenerator.genBinaryString(x, y, grid, maze);
        let config = wallGenerator.getWallConfig(binString);
        wallMesh = wallGenerator.createWall(
          config,
          Constants.WALL_SIZE,
          Constants.WALL_SIZE
        );
        wallMesh.position.set(
          x * Constants.WALL_SIZE,
          0,
          y * Constants.WALL_SIZE
        );
        mazeGroup.add(wallMesh);
        continue;
        // check if its the

        //        scene.add(wallMesh)
        // const m = new THREE.Matrix4();
        //m.set(1, 0, 0, x * Constants.WALL_SIZE, 0, 1, 0, wallHeight / 2, 0, 0, 1, y * Constants.WALL_SIZE, 0, 0, 0, 1);

        // geometryArr.push(wallGeometry.applyMatrix4(m));
      }
    }
  }
  scene.add(mazeGroup);
}

// var mazeGeo = BufferGeometryUtils.mergeBufferGeometries(geometryArr);
// mazeGeo.computeVertexNormals();
// var mazeMesh = new THREE.Mesh(mazeGeo, wallMaterial);
// mazeMesh.castShadow = true;
// mazeMesh.receiveShadow = true;
// scene.add(mazeMesh);

function onWindowResize() {
  playerController.camera.aspect = window.innerWidth / window.innerHeight;
  playerController.camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth / Constants.BLOCKINESS,
    innerHeight / Constants.BLOCKINESS
  );
  renderer.domElement.style.width = innerWidth;
  renderer.domElement.style.height = innerHeight;
}

function render() {
  renderer.render(scene, playerController.camera);
}

export default GameManager;

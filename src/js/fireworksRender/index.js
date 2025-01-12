import {
  BoxGeometry,
  ShaderMaterial,
  MeshLambertMaterial,
  Mesh,
  BufferGeometry,
  Points,
  BufferAttribute,
  TextureLoader,
  Color,
} from 'three';

import vertexShader from './shader/fireworks/vertex.glsl';
import fragmentShader from './shader/fireworks/fragment.glsl';
import pointTex from '@/assets/image/particles/1.png';

const textureLoader = new TextureLoader();

const getRandomColor = () => {
  // const r = Math.round(Math.random() * 255);
  // const g = Math.round(Math.random() * 255);
  // const b = Math.round(Math.random() * 255);
  // return new Color(`rgb(${r},${g},${b})`);
  const h = Math.round(Math.random() * 360);
  const s = Math.round(Math.random() * 20 + 60);
  const l = Math.round(Math.random() * 20 + 60);
  return new Color(`hsl(${h},${s}%,${l}%)`);
};

class Fireworks{
  constructor(val) {
    const { scene } = val;
    this.scene = scene;

    // 烟花的mesh
    this.fireworksList = [];
    // 烟花爆炸效果的mesh
    this.fireworksExplorerList = [];
    this.fireDisappearFireworksList = [];

    // 加载纹理
    this.pointTexture = textureLoader.load(pointTex);

    this.init();
  }

  // 初始化一个立方体，作为参照
  init() {
    const geometry = new BoxGeometry(20, 20, 20);
    const material = new MeshLambertMaterial({
      color: 0xff0000,
    });

    this.boxMesh = new Mesh(geometry, material);
    this.boxMesh.position.set(0, -10, 0);
    this.scene.add(this.boxMesh);
  }

  // 生成烟花
  generateFirework() {
    const geometry = new BufferGeometry();

    const position = new Float32Array(3);
    position[0] = 0;
    position[1] = 0;
    position[2] = 0;
    geometry.setAttribute('position', new BufferAttribute(position, 3));

    // const direction = new Float32Array(3);
    const theta = Math.random() * 2 * Math.PI; // 水平方向上的任意角度
    const beta = Math.random() * Math.PI; // 竖直的正方向上的任意角度
    // const r = Math.random();
    // direction[0] = Math.sin(theta) + Math.sin(beta);
    // direction[1] = Math.cos(theta) + Math.cos(beta);
    // direction[2] = Math.sin(theta) + Math.cos(beta);
    geometry.setAttribute(
      'aDirectionX',
      new BufferAttribute(new Float32Array([theta]), 1)
    );
    geometry.setAttribute(
      'aDirectionY',
      new BufferAttribute(new Float32Array([beta]), 1));

    geometry.userData.speed = Math.random() * 0.3 + 0.5;

    const aLengthArr = new Float32Array([0]);
    geometry.setAttribute('aLength', new BufferAttribute(aLengthArr, 1));
    const randomColor = getRandomColor();
    geometry.setAttribute(
      'aColor',
      new BufferAttribute(new Float32Array([randomColor.r, randomColor.g, randomColor.b]), 3)
    );

    const material = new ShaderMaterial({
      uniforms: {
        uTexture: {
          value: this.pointTexture,
        },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const points = new Points(geometry, material);
    this.fireworksList.push(points);
    this.scene.add(points);
  }

  // 生成烟花爆炸的效果
  // 使用的参数为烟花消失的位置
  generateFireworksExplorer(endPosition) {
    const { x, y, z } = endPosition;
    const geometry = new BufferGeometry();

    const fireworksExplorerCount = Math.round(Math.random() * 100) + 60;
    const position = new Float32Array(fireworksExplorerCount * 3);
    const aDirectionXArr = new Float32Array(fireworksExplorerCount);
    const aDirectionYArr = new Float32Array(fireworksExplorerCount);
    const randomColorArr = new Float32Array(fireworksExplorerCount * 3);
    // 设置初始位置
    for (let i = 0; i < fireworksExplorerCount; i++) {
      position[i * 3] = x;
      position[i * 3 + 1] = y;
      position[i * 3 + 2] = z;

      const theta = Math.random() * 2 * Math.PI; // 水平方向上的任意角度
      const beta = Math.random() * 2 * Math.PI; // 竖直方向上的任意角度
      aDirectionXArr[i] = theta;
      aDirectionYArr[i] = beta;

      const randomColor = getRandomColor();
      randomColorArr[i * 3] = randomColor.r;
      randomColorArr[i * 3 + 1] = randomColor.g;
      randomColorArr[i * 3 + 2] = randomColor.b;
      if (!geometry.userData.speed) {
        geometry.userData.speed = [];
      }
      geometry.userData.speed.push(Math.random() * 0.46 + 0.1);
    }
    geometry.setAttribute(
      'position',
      new BufferAttribute(position, 3),
    );
    geometry.setAttribute(
      'aDirectionX',
      new BufferAttribute(aDirectionXArr, 1),
    );
    geometry.setAttribute(
      'aDirectionY',
      new BufferAttribute(aDirectionYArr, 1),
    );
    geometry.setAttribute(
      'aLength',
      new BufferAttribute(new Float32Array(new Array(fireworksExplorerCount).fill(0)), 1),
    );
    geometry.setAttribute(
      'aColor',
      new BufferAttribute(randomColorArr, 3),
    );
    geometry.userData.times = 0;

    const material = new ShaderMaterial({
      uniforms: {
        uTexture: {
          value: this.pointTexture,
        },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const points = new Points(geometry, material);
    this.fireworksExplorerList.push(points);
    this.scene.add(points);
  }

  // 点击事件触发后调用的函数
  handleClick() {
    this.generateFirework();
  }

  render(time, interval) {
    // 根据interval重复设置点移动的距离length
    // this.mesh.geometry.setAttribute();
    this.fireworksList = this.fireworksList.reduce((val, item) => {
      const oldLength = item.geometry.getAttribute('aLength').array;
      const newLength = oldLength.map(lengthItem => {
        let mapRes = lengthItem + interval;
        mapRes += item.geometry.userData.speed;
        return mapRes;
      });
      // 判断是否要移除mesh
      if (newLength[0] > 40) {
        item.visible = false;
        item.geometry.dispose();
        item.material.dispose();
        this.scene.remove(item);

        const length = oldLength[0];
        const directionX = item.geometry.getAttribute('aDirectionX').array[0];
        const directionY = item.geometry.getAttribute('aDirectionY').array[0];
        const xozLength = Math.cos(directionY) * length;
        const x = xozLength * Math.cos(directionX);
        const y = length * Math.sin(directionY);
        const z = xozLength * Math.sin(directionX);
        this.generateFireworksExplorer({ x, y, z });

      } else {
        item.geometry.setAttribute('aLength', new BufferAttribute(newLength, 1));
        val.push(item);
      }
      return val;
    }, []);

    // 烟花爆炸时的效果
    this.fireworksExplorerList = this.fireworksExplorerList.reduce((val, item, index) => {
      const oldLength = item.geometry.getAttribute('aLength').array;
      const newLength = oldLength.map(lengthItem => {
        let mapRes = lengthItem + interval;
        mapRes += item.geometry.userData.speed[index];
        return mapRes;
      });

      // todo - 当前绽放的效果，类似于一个纸筒的效果，未实现球的爆炸效果
      item.geometry.userData.times += 1;
      if (item.geometry.userData.times > 80) {
        item.visible = false;
        item.geometry.dispose();
        item.material.dispose();
        this.scene.remove(item);
      } else {
        item.geometry.setAttribute('aLength', new BufferAttribute(newLength, 1));
        val.push(item);
      }
      return val;
    }, []);
    // 烟花逐渐消失的效果
    // this.fireDisappearFireworksList = this.fireDisappearFireworksList.reduce((val, item) => {

    //   return val
    // }, []);
  }
}

export default Fireworks;

import { Float, PerspectiveCamera, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Euler, Group, Vector3 } from "three";
import { usePlay } from "../contexts/Play";
import { fadeOnBeforeCompile } from "../utils/fadeMaterial";
import { Airplane } from "./Airplane";
import { Spaceship } from "./Spaceship";
import { Astronaut } from "./Astronaut";
import { Asteroid } from "./Asteroid";
import { Planet } from "./Planet";
import { Jet } from "./Jet";
import { Alien } from "./Alien"
import { Comet } from "./Comet";
import { Background } from "./Background";
import { Cloud } from "./Cloud";
import { Speed } from "./Speed";
import { TextSection } from "./TextSection";
import { Star } from "./Star"

const LINE_NB_POINTS = 1000;
const CURVE_DISTANCE = 250;
const CURVE_AHEAD_CAMERA = 0.01;
const CURVE_AHEAD_AIRPLANE = 0.02;
const AIRPLANE_MAX_ANGLE = 35;
const FRICTION_DISTANCE = 42;

export const Experience = () => {
  // const [skip, setSkip] = useState(false); // Add skip state

  // const handleSkip = () => {
  //   setSkip(true);
  //   setEnd(true);
  //   planeOutTl.current.play();
  // };

  // useFrame((_state, delta) => {
  //   if (skip) {
  //     lastScroll.current = -8;
  //     tl.current.seek(tl.current.duration());
  //     const curPoint = curve.getPoint(-8);
  //     cameraGroup.current.position.copy(curPoint);
  //     const lookAtPoint = curve.getPoint(-8);
  //     const targetLookAt = new THREE.Vector3().subVectors(curPoint, lookAtPoint).normalize();
  //     cameraGroup.current.lookAt(cameraGroup.current.position.clone().add(targetLookAt));
  //     return;
  //   }
  // })
  const curvePoints = useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -CURVE_DISTANCE),
      new THREE.Vector3(100, 0, -2 * CURVE_DISTANCE),
      new THREE.Vector3(-100, 0, -3 * CURVE_DISTANCE),
      new THREE.Vector3(100, 0, -4 * CURVE_DISTANCE),
      new THREE.Vector3(-50, 0, -5 * CURVE_DISTANCE),
      new THREE.Vector3(0, 0, -6 * CURVE_DISTANCE),
      new THREE.Vector3(0, 0, -7 * CURVE_DISTANCE),
      new THREE.Vector3(0, 0, -8 * CURVE_DISTANCE),
    ],
    []
  );

  const sceneOpacity = useRef(0);
  const lineMaterialRef = useRef();

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(curvePoints, false, "catmullrom", 0.5);
  }, []);

  const textSections = useMemo(() => {
    return [
      {
        cameraRailDist: -1,
        position: new Vector3(
          curvePoints[1].x - 3,
          curvePoints[1].y,
          curvePoints[1].z
        ),
        title: `Welcome 2 NexusPlus,`,
        subtitle: `
Have a seat and enjoy the ride!`,
      },
      {
        cameraRailDist: 1.5,
        position: new Vector3(
          curvePoints[2].x + 2,
          curvePoints[2].y,
          curvePoints[2].z
        ),
        title: "What's NexusPlus?",
        subtitle: `A new experience you never have tried before!`,
      },
      {
        cameraRailDist: -1,
        position: new Vector3(
          curvePoints[3].x - 3,
          curvePoints[3].y,
          curvePoints[3].z
        ),
        title: "What do we offer?",
        subtitle: `Our idea is to take communication to the next level.`,
      },
      {
        cameraRailDist: 1.5,
        position: new Vector3(
          curvePoints[4].x + 3.5,
          curvePoints[4].y,
          curvePoints[4].z - 12
        ),
        title: "AI included? no issues🤖",
        subtitle: `We integrated AI, to make it easier for our guests!`
      },
      {
        cameraRailDist: -1,
        position: new Vector3(
          curvePoints[5].x - 3,
          curvePoints[5].y,
          curvePoints[5].z
        ),
        title: "Security? don't worry",
        subtitle: `Our security team is on the mission to guarantee security for each user!`,
      },
    ];
  }, []);

  const clouds = useMemo(
    () => [
      // STARTING
      {
        position: new Vector3(-3.5, -3.2, -7),
      },
      {
        position: new Vector3(3.5, -4, -10),
      },
      {
        scale: new Vector3(4, 4, 4),
        position: new Vector3(-18, 0.2, -68),
        rotation: new Euler(-Math.PI / 5, Math.PI / 6, 0),
      },
      {
        scale: new Vector3(2.5, 2.5, 2.5),
        position: new Vector3(10, -1.2, -52),
      },
      // FIRST POINT
      {
        scale: new Vector3(4, 4, 4),
        position: new Vector3(
          curvePoints[1].x + 10,
          curvePoints[1].y - 4,
          curvePoints[1].z + 64
        ),
      },
      {
        scale: new Vector3(3, 3, 3),
        position: new Vector3(
          curvePoints[1].x - 20,
          curvePoints[1].y + 4,
          curvePoints[1].z + 28
        ),
        rotation: new Euler(0, Math.PI / 7, 0),
      },
      {
        rotation: new Euler(0, Math.PI / 7, Math.PI / 5),
        scale: new Vector3(5, 5, 5),
        position: new Vector3(
          curvePoints[1].x - 13,
          curvePoints[1].y + 4,
          curvePoints[1].z - 62
        ),
      },
      {
        rotation: new Euler(Math.PI / 2, Math.PI / 2, Math.PI / 3),
        scale: new Vector3(5, 5, 5),
        position: new Vector3(
          curvePoints[1].x + 54,
          curvePoints[1].y + 2,
          curvePoints[1].z - 82
        ),
      },
      {
        scale: new Vector3(5, 5, 5),
        position: new Vector3(
          curvePoints[1].x + 8,
          curvePoints[1].y - 14,
          curvePoints[1].z - 22
        ),
      },
      // SECOND POINT
      {
        scale: new Vector3(3, 3, 3),
        position: new Vector3(
          curvePoints[2].x + 6,
          curvePoints[2].y - 7,
          curvePoints[2].z + 50
        ),
      },
      {
        scale: new Vector3(2, 2, 2),
        position: new Vector3(
          curvePoints[2].x - 2,
          curvePoints[2].y + 4,
          curvePoints[2].z - 26
        ),
      },
      {
        scale: new Vector3(4, 4, 4),
        position: new Vector3(
          curvePoints[2].x + 12,
          curvePoints[2].y + 1,
          curvePoints[2].z - 86
        ),
        rotation: new Euler(Math.PI / 4, 0, Math.PI / 3),
      },
      // THIRD POINT
      {
        scale: new Vector3(3, 3, 3),
        position: new Vector3(
          curvePoints[3].x + 3,
          curvePoints[3].y - 10,
          curvePoints[3].z + 50
        ),
      },
      {
        scale: new Vector3(3, 3, 3),
        position: new Vector3(
          curvePoints[3].x - 10,
          curvePoints[3].y,
          curvePoints[3].z + 30
        ),
        rotation: new Euler(Math.PI / 4, 0, Math.PI / 5),
      },
      {
        scale: new Vector3(4, 4, 4),
        position: new Vector3(
          curvePoints[3].x - 20,
          curvePoints[3].y - 5,
          curvePoints[3].z - 8
        ),
        rotation: new Euler(Math.PI, 0, Math.PI / 5),
      },
      {
        scale: new Vector3(5, 5, 5),
        position: new Vector3(
          curvePoints[3].x + 0,
          curvePoints[3].y - 5,
          curvePoints[3].z - 98
        ),
        rotation: new Euler(0, Math.PI / 3, 0),
      },
      // FOURTH POINT
      {
        scale: new Vector3(2, 2, 2),
        position: new Vector3(
          curvePoints[4].x + 3,
          curvePoints[4].y - 10,
          curvePoints[4].z + 2
        ),
      },
      {
        scale: new Vector3(3, 3, 3),
        position: new Vector3(
          curvePoints[4].x + 24,
          curvePoints[4].y - 6,
          curvePoints[4].z - 42
        ),
        rotation: new Euler(Math.PI / 4, 0, Math.PI / 5),
      },
      {
        scale: new Vector3(3, 3, 3),
        position: new Vector3(
          curvePoints[4].x - 4,
          curvePoints[4].y + 9,
          curvePoints[4].z - 62
        ),
        rotation: new Euler(Math.PI / 3, 0, Math.PI / 3),
      },
      // // FINAL
      // {
      //   scale: new Vector3(3, 3, 3),
      //   position: new Vector3(
      //     curvePoints[7].x + 12,
      //     curvePoints[7].y - 5,
      //     curvePoints[7].z + 60
      //   ),
      //   rotation: new Euler(-Math.PI / 4, -Math.PI / 6, 0),
      // },
      // {
      //   scale: new Vector3(3, 3, 3),
      //   position: new Vector3(
      //     curvePoints[7].x - 12,
      //     curvePoints[7].y + 5,
      //     curvePoints[7].z + 120
      //   ),
      //   rotation: new Euler(Math.PI / 4, Math.PI / 6, 0),
      // },
    ],
    []
  );

  const people = useMemo(
    () => [
      // FINAL
      {
        scale: new Vector3(7, 7, 7),
        position: new Vector3(
          curvePoints[6].x - 20,
          curvePoints[6].y - 15,
          curvePoints[6].z + 60
        ),
        rotation: new Euler(1, 1, 6),
      },
      {
        scale: new Vector3(7, 7, 7),
        position: new Vector3(
          curvePoints[6].x - 22,
          curvePoints[6].y - 1,
          curvePoints[6].z + 20
        ),
        rotation: new Euler(3, 1, 6),
      },
      {
        scale: new Vector3(7, 7, 7),
        position: new Vector3(
          curvePoints[6].x + 3,
          curvePoints[6].y - 1,
          curvePoints[6].z + 80
        ),
        rotation: new Euler(2, 0, 3),
      },
      {
        scale: new Vector3(7, 7, 7),
        position: new Vector3(
          curvePoints[6].x - 22,
          curvePoints[6].y + 5,
          curvePoints[6].z + 120
        ),
        rotation: new Euler(0, -2, 0),
      },
      {
        scale: new Vector3(7, 7, 7),
        position: new Vector3(
          curvePoints[7].x - 20,
          curvePoints[7].y - 10,
          curvePoints[7].z + 60
        ),
        rotation: new Euler(1, 1, 6),
      },
      {
        scale: new Vector3(7, 7, 7),
        position: new Vector3(
          curvePoints[7].x + 20,
          curvePoints[7].y + 10,
          curvePoints[7].z + 60
        ),
        rotation: new Euler(1, 1, 6),
      },
      {
        scale: new Vector3(10, 10, 10),
        position: new Vector3(
          curvePoints[7].x + 20,
          curvePoints[7].y - 10,
          curvePoints[7].z + 80
        ),
        rotation: new Euler(2, 0, 3),
      },
      {
        scale: new Vector3(10, 10, 10),
        position: new Vector3(
          curvePoints[7].x - 10,
          curvePoints[7].y + 5,
          curvePoints[7].z + 120
        ),
        rotation: new Euler(0, -2, 0),
      },
    ], []
  )
  const rocks = useMemo(
    () => [
      {
        scale: new Vector3(2, 2, 2),
        position: new Vector3(
          curvePoints[8].x - 20,
          curvePoints[8].y - 10,
          curvePoints[8].z + 100
        ),
        rotation: new Euler(-1, -2, -1),
      },
      {
        scale: new Vector3(1, 1, 1),
        position: new Vector3(
          curvePoints[8].x - 25,
          curvePoints[8].y + 7,
          curvePoints[8].z + 70
        ),
        rotation: new Euler(-1, -2, -1),
      },
      {
        scale: new Vector3(1, 1, 1),
        position: new Vector3(
          curvePoints[8].x - 25,
          curvePoints[8].y + 6,
          curvePoints[8].z + 130
        ),
        rotation: new Euler(-1, -2, -1),
      },
    ], []
  )

  const shape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.08);
    shape.lineTo(0, 0.08);

    return shape;
  }, [curve]);

  const cameraGroup = useRef();
  const cameraRail = useRef();
  const camera = useRef();
  const scroll = useScroll();
  const lastScroll = useRef(0);

  const { play, setHasScroll, end, setEnd } = usePlay();

  useFrame((_state, delta) => {
    if (window.innerWidth > window.innerHeight) {
      // LANDSCAPE
      camera.current.fov = 30;
      camera.current.position.z = 5;
    } else {
      // PORTRAIT
      camera.current.fov = 80;
      camera.current.position.z = 2;
    }

    if (lastScroll.current <= 0 && scroll.offset > 0) {
      setHasScroll(true);
    }

    if (play && !end && sceneOpacity.current < 1) {
      sceneOpacity.current = THREE.MathUtils.lerp(
        sceneOpacity.current,
        1,
        delta * 0.1
      );
    }

    if (end && sceneOpacity.current > 0) {
      sceneOpacity.current = THREE.MathUtils.lerp(
        sceneOpacity.current,
        0,
        delta
      );
    }

    lineMaterialRef.current.opacity = sceneOpacity.current;

    if (end) {
      return;
    }

    const scrollOffset = Math.max(0, scroll.offset);

    let friction = 1;
    let resetCameraRail = true;
    // LOOK TO CLOSE TEXT SECTIONS
    textSections.forEach((textSection) => {
      const distance = textSection.position.distanceTo(
        cameraGroup.current.position
      );

      if (distance < FRICTION_DISTANCE) {
        friction = Math.max(distance / FRICTION_DISTANCE, 0.1);
        const targetCameraRailPosition = new Vector3(
          (1 - distance / FRICTION_DISTANCE) * textSection.cameraRailDist,
          0,
          0
        );
        cameraRail.current.position.lerp(targetCameraRailPosition, delta);
        resetCameraRail = false;
      }
    });
    if (resetCameraRail) {
      const targetCameraRailPosition = new Vector3(0, 0, 0);
      cameraRail.current.position.lerp(targetCameraRailPosition, delta);
    }

    // CALCULATE LERPED SCROLL OFFSET
    let lerpedScrollOffset = THREE.MathUtils.lerp(
      lastScroll.current,
      scrollOffset,
      delta * friction
    );
    // PROTECT BELOW 0 AND ABOVE 1
    lerpedScrollOffset = Math.min(lerpedScrollOffset, 1);
    lerpedScrollOffset = Math.max(lerpedScrollOffset, 0);

    lastScroll.current = lerpedScrollOffset;
    tl.current.seek(lerpedScrollOffset * tl.current.duration());

    const curPoint = curve.getPoint(lerpedScrollOffset);

    // Follow the curve points
    cameraGroup.current.position.lerp(curPoint, delta * 24);

    // Make the group look ahead on the curve

    const lookAtPoint = curve.getPoint(
      Math.min(lerpedScrollOffset + CURVE_AHEAD_CAMERA, 1)
    );

    const currentLookAt = cameraGroup.current.getWorldDirection(
      new THREE.Vector3()
    );
    const targetLookAt = new THREE.Vector3()
      .subVectors(curPoint, lookAtPoint)
      .normalize();

    const lookAt = currentLookAt.lerp(targetLookAt, delta * 24);
    cameraGroup.current.lookAt(
      cameraGroup.current.position.clone().add(lookAt)
    );

    // Airplane rotation

    const tangent = curve.getTangent(lerpedScrollOffset + CURVE_AHEAD_AIRPLANE);

    const nonLerpLookAt = new Group();
    nonLerpLookAt.position.copy(curPoint);
    nonLerpLookAt.lookAt(nonLerpLookAt.position.clone().add(targetLookAt));

    tangent.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      -nonLerpLookAt.rotation.y
    );

    let angle = Math.atan2(-tangent.z, tangent.x);
    angle = -Math.PI / 2 + angle;

    let angleDegrees = (angle * 180) / Math.PI;
    angleDegrees *= 2.4; // stronger angle

    // LIMIT PLANE ANGLE
    if (angleDegrees < 0) {
      angleDegrees = Math.max(angleDegrees, -AIRPLANE_MAX_ANGLE);
    }
    if (angleDegrees > 0) {
      angleDegrees = Math.min(angleDegrees, AIRPLANE_MAX_ANGLE);
    }

    // SET BACK ANGLE
    angle = (angleDegrees * Math.PI) / 180;

    const targetAirplaneQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        airplane.current.rotation.x,
        airplane.current.rotation.y,
        angle
      )
    );
    airplane.current.quaternion.slerp(targetAirplaneQuaternion, delta * 2);

    if (
      cameraGroup.current.position.z <
      curvePoints[curvePoints.length - 1].z + 100
    ) {
      setEnd(true);
      planeOutTl.current.play();
    }
  });

  const airplane = useRef();

  const tl = useRef();
  const backgroundColors = useRef({
    colorA: "#0074D9", // Dark space blue
    colorB: "#7FDBFF", // Deep purple like a nebula
  });

  const planeInTl = useRef();
  const planeOutTl = useRef();

  useLayoutEffect(() => {
    tl.current = gsap.timeline();

    tl.current.to(backgroundColors.current, {
      duration: 1,
      colorA: "#3535cc",
      colorB: "#abaadd",
    });
    tl.current.to(backgroundColors.current, {
      duration: 1,
      colorA: "#FF5C1BFF", // Cosmic violet
      colorB: "#B10DC9", // Dark galaxy blue
    });
    tl.current.to(backgroundColors.current, {
      duration: 1,
      colorA: "#6E16ADFF", // Dark space red
      colorB: "#000000", // Nebula blue
    });


    tl.current.pause();

    planeInTl.current = gsap.timeline();
    planeInTl.current.pause();
    planeInTl.current.from(airplane.current.position, {
      duration: 3,
      z: 5,
      y: -2,
    });

    planeOutTl.current = gsap.timeline();
    planeOutTl.current.pause();

    planeOutTl.current.to(
      airplane.current.position,
      {
        duration: 10,
        z: -250,
        y: 10,
      },
      0
    );
    planeOutTl.current.to(
      cameraRail.current.position,
      {
        duration: 8,
        y: 12,
      },
      0
    );
    planeOutTl.current.to(airplane.current.position, {
      duration: 1,
      z: -1000,
    });
  }, []);

  useEffect(() => {
    if (play) {
      planeInTl.current.play();
    }
  }, [play]);

  return useMemo(
    () => (
      <>
        <directionalLight position={[0, 3, 1]} intensity={0.1} />
        <group ref={cameraGroup}>
          <Speed />
          <Background backgroundColors={backgroundColors} />
          <group ref={cameraRail}>
            <Star />
            <PerspectiveCamera
              ref={camera}
              position={[0, 0, 5]}
              fov={30}
              makeDefault
            />
          </group>
          <group ref={airplane}>
            <Float floatIntensity={1.2} speed={1.5} rotationIntensity={0.5}>
              {/* <Jet
                rotation-y={Math.PI}
                scale={[0.01, 0.01, 0.01]}
                position-y={-0.15}
              /> */}
              <Spaceship
                rotation-y={Math.PI}
                scale={[0.002, 0.002, 0.002]}
                position-y={-0.2}
              />
            </Float>
          </group>
        </group>
        {/* TEXT */}
        {textSections.map((textSection, index) => (
          <TextSection {...textSection} key={index} />
        ))}

        {/* LINE */}
        <group position-y={-2}>
          <mesh>
            <extrudeGeometry
              args={[
                shape,
                {
                  steps: LINE_NB_POINTS,
                  bevelEnabled: false,
                  extrudePath: curve,
                },
              ]}
            />
            <meshStandardMaterial
              color={"white"}
              ref={lineMaterialRef}
              transparent
              envMapIntensity={2}
              onBeforeCompile={fadeOnBeforeCompile}
            />
          </mesh>
        </group>

        {/* CLOUDS */}
        {clouds.map((cloud, index) => (
          <Cloud sceneOpacity={sceneOpacity} {...cloud} key={index} />
        ))}
        {people.map((rock, index) => (
          <Astronaut sceneOpacity={sceneOpacity} {...rock} key={index} />
        ))}
        {rocks.map((rock, index) => (
          <Comet {...rock} key={index} sceneOpacity={sceneOpacity} />
        ))}

        {/* SKIP BUTTON */}
        {/* <button
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            padding: "10px 20px",
            backgroundColor: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            borderRadius: "5px",
          }}
          onClick={handleSkip}
        >
          Skip
        </button> */}
      </>
    ),
    []
  );
};

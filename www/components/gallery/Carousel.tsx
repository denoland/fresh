import { tw } from "twind";
import { asset } from "$fresh/runtime.ts";
import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import IconCircleChevronsRight from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-right.tsx";
import IconCircleChevronsLeft from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-left.tsx";

const SLIDE_DATA = [
  {
    color: "bg-green-300",
    text: "slide one",
    url: asset("/illustration/deno-plush.svg"),
  },
  {
    color: "bg-yellow-300",
    text: "slide two",
    url: asset("/illustration/lemon-squash.svg"),
  },
  {
    color: "bg-blue-300",
    text: "slide three",
    url: asset("/illustration/deno-plush.svg"),
  },
  {
    color: "bg-yellow-300",
    text: "slide four",
    url: asset("/illustration/lemon-squash.svg"),
  },
];

type SlideProps = {
  class?: string;
  key?: number;
  data: {
    color: string;
    text: string;
    url: string;
  };
};

const Slide = (props: SlideProps) => {
  const { key, data } = props;
  const { color, text, url } = data;
  if (props.class === undefined) props.class = "";
  return (
    <div
      key={key}
      class={`${props.class} ${color} h-80 w-full text-center text-black p-5`}
    >
      {text}
      <img src={url} />
    </div>
  );
};

type CarouselProps = {
  showNavigation?: boolean;
  interval?: number;
  currentSlide?: number;
  automatic?: boolean;
  class?: string;
};

const Carousel = (props: CarouselProps) => {
  const NAVIGATION_COLOR = `hover:text-gray-300 text-white`;
  const CHEVRON_STYLE =
    `absolute z-30 w-10 h-10 ${NAVIGATION_COLOR} cursor-pointer`;
  const SHOW_NAVIGATION = props.showNavigation === false ? false : true;
  const SLIDE_INTERVAL = props.interval ? props.interval : 3500;
  const currentSlide = useSignal(props.currentSlide ? props.currentSlide : 0);
  const automatic = useSignal(props.automatic === false ? false : true);
  const slideshowRef = useRef<HTMLDivElement>(null);

  const slideClasses = (idx = 0) => {
    let outgoingSlide = currentSlide.value - 1;
    let incomingSlide = currentSlide.value + 1;
    if (outgoingSlide === -1) outgoingSlide = SLIDE_DATA.length - 1;
    if (incomingSlide === SLIDE_DATA.length) incomingSlide = 0;
    // console.log(outgoingSlide, currentSlide.value, incomingSlide)
    const TRANSITION_CLASS = () => {
      if (currentSlide.value === idx) return "translate-x-0 z-20";
      if (incomingSlide === idx) return "translate-x-full z-10";
      if (outgoingSlide === idx) return "-translate-x-full z-10";
      return "translate-x-full";
    };
    return tw`slide absolute top-0 left-0 transition-all ease-in-out duration-700 transform ${TRANSITION_CLASS}`;
  };

  const nextSlide = () => {
    if (SLIDE_DATA.length === currentSlide.value + 1) {
      currentSlide.value = 0;
    } else {
      currentSlide.value++;
    }
  };

  const previousSlide = () => {
    if (currentSlide.value === 0) {
      currentSlide.value = SLIDE_DATA.length - 1;
    } else {
      currentSlide.value--;
    }
  };

  const chevronClick = (doCallback = () => {}) => {
    if (automatic.value) automatic.value = false;
    return doCallback();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (automatic.value) nextSlide();
    }, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const ArrowKeyNavigation = () => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (automatic.value) automatic.value = false;
      switch (event.code) {
        case "ArrowLeft":
          event.preventDefault();
          previousSlide();
          break;
        case "ArrowRight":
          event.preventDefault();
          nextSlide();
          break;
        default:
          break;
      }
    };
    slideshowRef.current?.addEventListener("keydown", keydownHandler);
    return () =>
      slideshowRef.current?.removeEventListener("keydown", keydownHandler);
  };
  useEffect(ArrowKeyNavigation, []);

  const goToSlide = (slide_index = 0) => {
    if (automatic.value) automatic.value = false;
    currentSlide.value = slide_index;
  };

  const DotsNavigation = () => (
    <div
      class={"slide_nav z-30 w-full absolute bottom-0 flex justify-center cursor-pointer"}
    >
      {SLIDE_DATA.map((_item, idx) => {
        return (
          <div
            class={`px-1 ${NAVIGATION_COLOR}`}
            onClick={() => {
              goToSlide(idx);
            }}
            key={idx}
          >
            {idx === currentSlide.value ? <>●</> : <>○</>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      ref={slideshowRef}
      class={`slideshow relative flex-1 flex-end p-0 overflow-hidden ${
        props.class !== undefined ? props.class : ""
      }`}
      tabIndex={0}
    >
      <IconCircleChevronsLeft
        class={`left-0 ${CHEVRON_STYLE}`}
        style="top: calc(50% - 20px)"
        onClick={() => chevronClick(previousSlide)}
      />
      <IconCircleChevronsRight
        class={`right-0 ${CHEVRON_STYLE}`}
        style="top: calc(50% - 20px)"
        onClick={() => chevronClick(nextSlide)}
      />
      {SLIDE_DATA.map((item, idx) => (
        <Slide
          data={item}
          key={idx}
          class={slideClasses(idx)}
        />
      ))}
      {SHOW_NAVIGATION &&
        <DotsNavigation />}
      <Slide
        data={SLIDE_DATA[0]}
        class="opacity-0 pointer-events-none"
      />
    </div>
  );
};

export default Carousel;

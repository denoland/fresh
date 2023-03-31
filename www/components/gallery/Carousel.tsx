import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import IconCircleChevronsRight from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-right.tsx";
import IconCircleChevronsLeft from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-left.tsx";
import { asset } from "$fresh/runtime.ts";
import { tw } from "twind";

const SLIDE_DATA = [
  {
    text: "slide one",
    color: "bg-green-300",
    url: asset("/illustration/deno-plush.svg"),
  },
  {
    text: "slide too",
    color: "bg-yellow-300",
    url: asset("/illustration/lemon-squash.svg"),
  },
  {
    text: "slide three",
    color: "bg-blue-300",
    url: asset("/illustration/deno-plush.svg"),
  },
  {
    text: "slide four",
    color: "bg-gray-300",
    url: asset("/illustration/lemon-squash.svg"),
  },
];

type SlideProps = {
  class?: string;
  key?: number;
  data: {
    text: string;
    color: string;
    url: string;
  };
};

const Slide = (props: SlideProps) => {
  const { key, data } = props;
  const { color, text, url } = data;
  if (props.class === undefined) props.class = "";
  const clazz =
    `${props.class} ${color} h-80 w-full text-center text-white p-5`;
  return (
    <div key={key} class={clazz}>
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
  const NAVIGATION_COLOR = `text-white`;
  const CHEVRON_STYLE =
    `absolute z-30 w-10 h-10 hover:text-grey ${NAVIGATION_COLOR} cursor-pointer`;
  const SHOW_NAVIGATION = props.showNavigation === false ? false : true;
  const SLIDE_INTERVAL = props.interval ? props.interval : 3500;
  const currentSlide = useSignal(props.currentSlide ? props.currentSlide : 0);
  const automatic = useSignal(props.automatic ? true : false);

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
    document.addEventListener("keydown", keydownHandler);
    return () => document.removeEventListener("keydown", keydownHandler);
  };
  useEffect(ArrowKeyNavigation, []);

  const goToSlide = (slide_index = 0) => {
    if (automatic.value) automatic.value = false;
    currentSlide.value = slide_index;
  };

  const DotsNavigation = () => (
    <div
      class={`slide_nav z-30 w-full ${NAVIGATION_COLOR} absolute bottom-0 flex justify-center cursor-pointer`}
    >
      {SLIDE_DATA.map((_item, idx) => {
        return (
          <div
            class="px-1 hover:text-grey"
            onClick={() => {
              goToSlide(idx);
            }}
          >
            {idx === currentSlide.value ? <>●</> : <>○</>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      class={`slideshow relative flex-1 flex-end p-0 overflow-hidden ${
        props.class !== undefined ? props.class : ""
      }`}
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
        key={0}
        class="opacity-0 pointer-events-none"
      />
    </div>
  );
};

export default Carousel;

import useEmblaCarousel from "embla-carousel-react";

export const Carousel = () => {
  const [emblaRef] = useEmblaCarousel();

  return (
    <div className="embla overflow-hidden" ref={emblaRef}>
      <div className="embla__container flex">
        <div className="min-w-0 flex-[0_0_100%] embla__slide">Slide 1</div>{" "}
        <div className="min-w-0 flex-[0_0_100%] embla__slide">Slide 2</div>{" "}
        <div className="min-w-0 flex-[0_0_100%] embla__slide">Slide 3</div>{" "}
      </div>
    </div>
  );
};

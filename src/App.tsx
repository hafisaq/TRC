import Curtain from "./components/Curtain";
import Cursor from "./components/Cursor";
import Chrome from "./components/Chrome";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import Ethos from "./components/Ethos";
import Destinations from "./components/Destinations";
import Chapters from "./components/Chapters";
import Film from "./components/Film";
import RouteMap from "./components/RouteMap";
import Journey from "./components/Journey";
import Testimonial from "./components/Testimonial";
import Standard from "./components/Standard";
import Enquire from "./components/Enquire";
import { useSiteAnimations } from "./hooks/useSiteAnimations";

export default function App() {
  useSiteAnimations();

  return (
    <>
      <Curtain />
      <Cursor />
      <Chrome />
      <Nav />

      <main id="top">
        <Hero />
        <Intro />
        <Ethos />
        <Destinations />
        <Chapters />
        <Film />
        <RouteMap />
        <Journey />
        <Testimonial />
        <Standard />
        <Enquire />
      </main>
    </>
  );
}

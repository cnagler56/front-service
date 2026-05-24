import Header from "@/src/components/Header/header";
import { NavigationBar } from "@/src/components/NavigationBar/navigationBar";
import Home from "@/src/components/Home/Home";

export default function Page() {
  return (
    <div>
      <main>
        <Header />
        <NavigationBar />
        <Home />
      </main>
    </div>
  );
}

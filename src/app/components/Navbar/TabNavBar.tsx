import Link from "next/link";
import useUserController from "./useUserController";
import { usePathname } from "next/navigation";

interface MenuTabNavProps {
  title: string;
  path: string;
  show: boolean;
}

export default function TabNavBar() {

  const { userData, isLogin } = useUserController();

  const menuTabNav: MenuTabNavProps[] = [
    {
      title: "Home",
      path: "/",
      show: true
    },
    {
      title: "Staff",
      path: "/staff",
      show: true,
    },
    {
      title: "Admin",
      path: "/admin/activity",
      show: userData.role === "admin" && isLogin
    },
  ]

  const activeTabMenuClassName = () => {
    return "text-primary-color"
  }

  const pathname = usePathname()

  const getActiveTabMenu = (currentPath: string) => {
    if (!pathname.startsWith(currentPath) || (currentPath === "/" && currentPath !== pathname)) return ""

    return activeTabMenuClassName()
  }


  return (
    <>
      <ul className="flex-grow flex justify-center border gap-6 md:gap-12 md:px-12 px-6 md:py-4 py-3 mr-6 nd:mr-0 rounded-full border-color-primary" >
        {menuTabNav.map((menu, index) => {
          return <>
            {menu.show && (
              <Link key={index} href={menu.path}>
                <p className={getActiveTabMenu(menu.path)}>{menu.title}</p>
              </Link >
            )}
          </>
        })}
      </ul >
    </>
  )
}
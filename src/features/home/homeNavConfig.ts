import type { NavigateFunction } from "react-router";
import {
  faCog,
  faRobot,
  faBox,
  faPaintBrush,
  faCode,
  faList,
  faCircleQuestion,
  faPlus,
  faGraduationCap,
  faClipboardCheck,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import type { NavItem } from "../../shared/store/navStore";

export function getHomeNavItems(navigate: NavigateFunction): NavItem[] {
  return [
     {
      icon: faHome,
      title: "Home",
      onClick: () => navigate("/"),
    },
    {
      icon: faPlus,
      title: "Add New Card",
      onClick: () => navigate("/add-card"),
    },
    {
      icon: faGraduationCap,
      title: "Learn",
      onClick: () => navigate("/learn-topic"),
    },
    {
      icon: faClipboardCheck,
      title: "Review",
      onClick: () => console.log("Review clicked"),
    },
    {
      icon: faCog,
      title: "Settings",
      children: [
        {
          icon: faPaintBrush,
          title: "Theme",
          onClick: () => navigate("/theme"),
        },
        {
          icon: faCode,
          title: "User Prompt",
          onClick: () => navigate("/custom-prompt"),
        },
        {
          icon: faBox,
          title: "Box Management",
          onClick: () => navigate("/box-management"),
        },
        {
          icon: faRobot,
          title: "AI Models",
          onClick: () => navigate("/ai-models"),
        },
        {
          icon: faList,
          title: "Edit list of words",
          onClick: () => console.log("Search"),
        },
        {
          icon: faCircleQuestion,
          title: "Help",
          onClick: () => console.log("Home"),
        },
      ],
    },
  ];
}

import React, { ReactNode } from "react";
import {
  SiHtml5,
  SiCss3,
  SiTypescript,
  SiJson,
} from "react-icons/si";
import {FcPicture, FcFile } from "react-icons/fc";
import { AiFillFileText } from "react-icons/ai";
import { IconChevronDown,IconChevronLeft } from "@tabler/icons-react";
import { DiJavascript } from "react-icons/di";

function getIconHelper() {
  const cache = new Map<string, ReactNode>();
  cache.set("js", <DiJavascript size={20} color="#fbcb38" />);
  cache.set("jsx", <DiJavascript color="#fbcb38" />);
  cache.set("ts", <SiTypescript size={15} color="#378baa" />);
  cache.set("tsx", <SiTypescript size={15} color="#378baa" />);
  cache.set("css", <SiCss3 color="purple" />);
  cache.set("json", <SiJson color="#5656e6" />);
  cache.set("html", <SiHtml5 color="#e04e2c" />);
  cache.set("png", <FcPicture />);
  cache.set("jpg", <FcPicture />);
  cache.set("ico", <FcPicture />);
  cache.set("txt", <AiFillFileText color="white" />);
  cache.set("closedDirectory", <IconChevronLeft />);
  cache.set("openDirectory", <IconChevronDown />);
  return function (extension: string, name: string): ReactNode {
    if (cache.has(extension)) return cache.get(extension);
    else if (cache.has(name)) return cache.get(name);
    else return <FcFile />;
  };
}

export const getIcon = getIconHelper();

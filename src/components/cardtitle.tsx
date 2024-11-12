import * as React from "react";
import  Link  from "next/link";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";

interface CardItem {
  title: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  link: string; // Menambahkan properti link
}

interface CardHomeProps {
  title: string;
  description: React.ReactNode;
  content: CardItem[];
  footer: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardHome: React.FC<CardHomeProps> = ({
  title,
  description,
  content,
  footer,
  icon,
}) => {
  return (
    <Card className="w-[600px]">
      {content.map((item, index) => (
        <Link href={item.link} key={index} className="item">
          <CardHeader>
            {icon && <div className="icon">{icon}</div>}
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {item.icon && <div className="item-icon">{item.icon}</div>}
          </CardContent>
          <CardFooter>{footer}</CardFooter>
        </Link>
      ))}
    </Card>
  );
};

import * as React from "react";
import { CardHome } from "./cardtitle";

interface CardItem {
  title: string;
  description: string;
  icon?: React.ReactNode; // Menambahkan properti ikon
  link: string; // Menambahkan properti link
}

interface CardListProps {
  cards: CardItem[]; // Array dari objek CardItem
  footer: React.ReactNode; // Footer untuk setiap card
  headerIcon?: React.ReactNode; // Ikon untuk header card
}

const CardList: React.FC<CardListProps> = ({ cards, footer, headerIcon }) => {
  return (
    <div className="card-list flex flex-wrap gap-3 justify-center">
      {cards.map((card, index) => (
        <CardHome
          key={index}
          title={card.title}
          description={card.description}
          content={[card]} // Isi konten dengan array satu item
          footer={footer}
          icon={headerIcon} // Ikon untuk header
        />
      ))}
    </div>
  );
};

export default CardList;

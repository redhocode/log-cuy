export type ProduksiType = {
  ProdID: string;
  HeaderProdType: string;
  HeaderProdDate: Date; // Keep as Date for processing
  DeptID: string;
  OrderID: string;
  OrderType: string;
  LocID: string;
  Remark: string;
  ItemID: string;
  ItemType: string;
  Bags: number;
  Kgs: number;
  BagsLeft: number;
  KgsLeft: number;
  UserName: string;
  UserDateTime: string;
};

export type LbkType = {
  MoveID: number;
  MoveType: string;
  LocID: string;
  MoveDate: Date;
  Remark: string;
  ItemID: number;
  Bags: number;
  Kgs: number;
  Username: string;
  UserName: string;
  UserDateTime: string;
};

export type LbmType = {
  MoveID: number;
  MoveType: string;
  LocID: string;
  MoveDate: Date;
  Remark: string;
  ItemID: number;
  Bags: number;
  Kgs: number;
  Username: string;
  UserName: string;
  UserDateTime: string;
}
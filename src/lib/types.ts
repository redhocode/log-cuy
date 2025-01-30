export type ProduksiType = {
  ProdID: string;
  ProdType: string;
  ProdDate: Date; // Keep as Date for processing
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
  HPPPrice: number;
  JamMulai: string;
  JamSelesai: string;
  BomRef: string;
  BomDate: string;
  Shift: string;
  Machine: string;
  Printed: string;
  NoBuktiB: string;
  NoBuktiH: string;
  rjn: string;
  CMesin1: string;
  CMesin2: string;
  CreateBOM: string;
  BOMRef: string;
  ProdIDlama: string;
  Notes: string;
  area: string;
  AreaSisa: number;
  PcsReject: number;
  Kgsreject: number;
  KgsAvalan: number;
  BagsAvalan: number;
  BagsProngkolan: number;
  KgsSusut: number;
  FGGroup0: string;
  Selesai: string;
  KgsProngkolan: number;
  Batch: string;
  NIKOpr1: string;
  NIKOpr2: string;
  ItemIDLeft: string;
  KgsBefore: number;
  BagsBefore: number;
  bags2: number;
  TransIDMixing: string;
  Keterangan: string;
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
  username: string;
  userdatetime: string;
  UserName: string;
  UserDateTime: string;
  HPPPrice: number;
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
  username: string;
  userdatetime: string;
  Username: string;
  UserName: string;
  UserDateTime: string;
  HPPPrice: number;
}
export type PenerimaanType = {
  MoveID: string;
  MoveType: string;
  OrderID: string;
  TransID: string;
  CompanyID: string;
  MoveDate: Date;
  LocID: string;
  Nopol: string;
  Nopen: string;
  TglNopen: Date;
  Supplier: string;
  itemID: string;
  bags: number;
  kgs: number;
  UserName: string;
  UserDateTime: string;
  satuan: string;
  TglSJSupplier: Date;
  CompanyID2: string;
  CompanyName1: string;
  Remark: string;
  ItemID: string;
  Bags: number;
  Kgs: number;
  username: string;
  userdatetime: string;
  Timbang: number;
  TipeEdit:number;
  RJN: number
  
}

export interface DataProduksi {
  ProdID: string;
  ProdType: string;
  ProdDate: string;
  DeptID: string;
  OrderID: string;
  OrderType: string;
  Shift: string;
  Machine: string;
  LocID: string;
  Remark: string;
  Printed: string;
  NoBuktiB: string;
  NoBuktiH: string;
  rjn: string;
  CMesin1: string;
  CMesin2: string;
  CreateBOM: string;
  BOMRef: string;
  BomDate: string;
  ProdIDlama: string;
  Notes: string;
  ItemID: string;
  ItemType: string
  Bags: number;
  Kgs: number;
  HPPPrice: number;
  BagsLeft: number;
  KgsLeft: number;
  UserName: string;
  UserDateTime: string;
  area: string;
  AreaSisa: number;
  PcsReject: number;
  Kgsreject: number;
  KgsAvalan: number;
  BagsAvalan: number;
  BagsProngkolan: number;
  KgsSusut: number;
  FGGroup0: string;
  JamMulai: string;
  JamSelesai: string;
  Selesai: string;
  KgsProngkolan: number;
  Batch: string;
  NIKOpr1: string;
  NIKOpr2: string;
  ItemIDLeft: string;
  KgsBefore: number;
  BagsBefore: number;
  bags2: number;
  TransIDMixing: string;
  Keterangan: string;
}

export interface MutasiType {
  MoveID: string;
  MoveType: string;
  MoveDate: Date;
  LocIDSrc: string;
  LocIDDest: string;
  Remark: string;
  OrderIDRef: string;
  OrderTypeRef: string;
  ItemID: string;
  Bags: number;
  Kgs: number;
  HPPPrice: number;
  username: string;
  userdatetime: string;
  rjn:number;
}

export interface Spktype {
  OrderID: string;
  OrderType: string;
  OrderDate: Date;
  PlanDate: Date;
  ItemID: string;
  Bags: number;
  Kgs: number;
  Remark: string;
  PRDeptID: string;
  TypeSO:string;
  UserName: string;
  UserDateTime: string;
  rjn: string;
  ItemIDDetail: string;
}
export interface stockType {
  MoveID: string;
  MoveType: string;
  MoveDate: Date;
  LocIDSrc: string;
  LocIDDest: string;
  Remark: string;
  ItemID: string;
  Bags: number;
  Kgs: number;
  username: string;
  userdatetime: string;
  rjn:number;
}

export interface PurchaseType {
  OrderID: string;
  OrderType: string;
  OrderDate: Date;
  CompanyID: string;
  Total: number;
  Curr: string;
  Rate: number;
  TotalRp: number;
  DueDate: string;
  Remark: string;
  TipeDokumen: string;
  DPP: string;
  ItemID: string;
  Bags: number;
  Kgs: number;
  UserName: string;
  UserDateTime: string;
  rjn: string;
  Price: number;
  TotalDetail: number;
  Satuan: string;
}

export interface kasType {
  RefNo: string;
  RefType: string;
  RefDate: Date;
  TotalRp: number;
  Status: string;
  Acc: string;
  Remark: string;
  Pos: string;
  Curr: string;
  username: string;
  userdatetime: string;
}

export interface logType{
  Remark: string;
  Username: string;
  UserDateTime: string;
  Kgs: number;
  TransNo: number;
  ItemID: string;
  TransDateTime: Date;
}

export interface masterType{
  ItemID: string;
  ItemName: string;
  ItemName2: string;
  ItemNameBuy: string;
  Mark: string;
  KodeJenis: string;
  SatuanKecil: string;
  Spec: string;  
  UserName: string;
  UserDateTime: string;
  NamaJenis: string;
}

export interface loguserType{
  Username: string;
  UserDateTime: Date;
  Kgs: number;
  TransNo: number;
  ItemID: string;
  TransDateTime: Date;
  Remark: string;
  UserDate: Date;
  UserTime: Date;
  TransDate: Date;
}

export interface logacrType {
  Username: string;
  IpAddr: string;
  Remark: string;
  UserDateTime: Date;
  UserDate: Date;
  UserTime: Date;
  TransDate: Date;
}

export interface trackPoType{
  OrderID: string;
  Remark: string;
  OrderDate: Date;
  PlanDate: Date;
  ItemID: string;
  Kgs: number;
  ItemType: string;
  Item_PO: string;
  Item_Prod: string;
  Qty_Prod: number;
  Qty_PO: number;
  ProdDate: Date;
  status: string;
  Dept: string;
}
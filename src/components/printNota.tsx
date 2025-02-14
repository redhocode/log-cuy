//import * as  react from "react";
import Image from "next/image";
const PrintNota = () => {
  return (
    <>
      <div>
        {/* logo */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Image
              src="/img/logo.png"
              alt="logo"
              width={350}
              height={400}
              className="ml-6"
            />
          </div>
          <div className="col-span-2">
            <div className="flex flex-col text-center justify-center font-semibold">
              <div>PT.CITI PLUMB</div>
              <div>
                Jl. Raya Plosowahyu Ds. Plosowahyu RT.04/RW.01 Kec. Lamongan
              </div>
              <div>Kab. Lamongan, Jawa Timur 62218, INDONESIA</div>
              <div>TELP.: +62322 3326577</div>
              <div className="text-lg">TAX ID : 03.001.823.8-618.000</div>
            </div>
          </div>
        </div>
        {/* logo */}
        {/* c */}
        <div className="col-span-2 mt-4">
          <div className="flex flex-col text-center justify-center font-semibold">
            <div className="text-lg">COMERCIAL INVOICE</div>
            <div className="text-md">Nomor Invoice</div>
            <div className=" font-normal"> tanggal</div>
          </div>
          <div className="text-md justify-end flex -mt-12">
            <b>Dok: BC 2.5</b>
          </div>
        </div>
        {/* c */}
        {/* d */}
        <div>
          <div className="grid grid-cols-4 gap-2 mt-8">
            <div>Seller</div>
            <div className="-ml-48">
              <div className="font-bold">PT.CITI PLUMB</div>
              <div>
                Jl. Raya Plosowahyu Ds. Plosowahyu RT.04/RW.01 Kec. Lamongan
              </div>
              <div>Kab. Lamongan, Jawa Timur 62218, INDONESIA</div>
              <div>TELP.: +62322 3326577</div>
              <div className="text-lg">TAX ID : 03.001.823.8-618.000</div>
            </div>
            <div>Buyer</div>
            <div className="-ml-48">
              <div className="font-bold">
                PT. SUGIH MAKMUR EKA INDUSTRI INDONESIA
              </div>
              <div>
                Jl. Raya Plosowahyu Ds. Plosowahyu RT.04/RW.01 Kec. Lamongan
              </div>

              <div className="text-lg">Nopol/Container :</div>
            </div>
          </div>
        </div>
        {/* d */}
        {/* e */}
        <div className="mt-8 flex justify-center">
        <table className="table-fixed gap-4 w-full">
          <thead>
            <tr>
              <th>NO</th>
              <th>QTY</th>
              <th>Unit</th>
              <th>Item Code</th>
              <th>Description</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>1,000</td>
              <td>PCS</td>
              <td>09vabhf</td>
              <td>Stainless bla balabal</td>
              <td>11909</td>
              <td>119090</td>
            </tr>
          </tbody>
        </table>
        </div>
        {/* e */}
      </div>
    </>
  );
};

export default PrintNota;

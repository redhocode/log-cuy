import Image from "next/image";
export default function Maintenance() {
    return (
        <div className="flex justify-center flex-col items-center mt-20">
            <Image src="/img/main.png" alt="maintenance" width={400} height={400} />
            <h1 className="text-5xl font-bold mt-5">Maaf server saya Matikan</h1>
        </div>
    );
}
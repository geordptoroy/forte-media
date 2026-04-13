import axios from 'axios';
import fs from 'fs';

const REAL_BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-CH-UA': '"Not(A:Brand";v="99", "Google Chrome";v="144", "Chromium";v="144"',
  'Sec-CH-UA-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site',
  'Referer': 'https://www.facebook.com/',
};

async function testMediaDownload(url: string, filename: string) {
  console.log(`>>> Testando download de: ${url}`);
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      headers: REAL_BROWSER_HEADERS,
      timeout: 10000,
    });

    console.log(`>>> Status: ${response.status}`);
    console.log(`>>> Content-Type: ${response.headers['content-type']}`);
    
    fs.writeFileSync(filename, response.data);
    console.log(`>>> Arquivo salvo com sucesso: ${filename} (${response.data.length} bytes)`);
    return true;
  } catch (error: any) {
    console.error(`!!! Erro no download: ${error.message}`);
    if (error.response) {
      console.error(`!!! Status do Erro: ${error.response.status}`);
      console.error(`!!! Dados do Erro: ${error.response.data.toString()}`);
    }
    return false;
  }
}

// URLs de exemplo fornecidas pelo usuário
const imageUrl = "https://scontent.fpoj2-1.fna.fbcdn.net/v/t39.35426-6/671169360_2038415403406769_2271865186973211552_n.jpg?stp=dst-jpg_s600x600_tt6&_nc_cat=108&ccb=1-7&_nc_sid=c53f8f&_nc_ohc=_4dxmow9YnkQ7kNvwHIzbPA&_nc_oc=AdruFQJjsNRvYw0iEVw3uwVEz7NaEuk5e3wFpng-bZE8PjKDHaxobBdMkQkEjmwVVuQ&_nc_zt=14&_nc_ht=scontent.fpoj2-1.fna&_nc_gid=a-nXamMJqLEOdJbHC95DwA&_nc_ss=7a3a8&oh=00_Af2vlPkf59nQPVEuCBzK2bfHGIHqn49nBcix_sraYQ-5pg&oe=69E34C4D";
const videoUrl = "https://scontent.fpoj2-1.fna.fbcdn.net/o1/v/t2/f2/m367/AQODvCmhYcB1wxgbmrSsCFsUdoSImu3QVhNDdGQzGRjRTtsQhVtVVZ-_J1fOCMM7f15ROuOL52XTC3xdA0ebBcbXrwsbeJoMqgNpeg1n_w.mp4?_nc_cat=106&_nc_oc=AdoKIUBB95QdGMMd0OnZLcLimmBnanl-scB7vhA2l8X8XeHt-2VUpHHY6ixUgYWfA9M&_nc_sid=8bf8fe&_nc_ht=scontent.fpoj2-1.fna.fbcdn.net&_nc_ohc=qz54SaeMQbkQ7kNvwF3vUT3&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5WSV9VU0VDQVNFX1BST0RVQ1RfVFlQRS4uQzMuMzYwLnByb2dyZXNzaXZlX2gyNjQtYmFzaWMtZ2VuMl8zNjBwIiwieHB2X2Fzc2V0X2lkIjoxNzk1NTc2ODgwNDExNzMxMywiYXNzZXRfYWdlX2RheXMiOjAsInZpX3VzZWNhc2VfaWQiOjEwMDk5LCJkdXJhdGlvbl9zIjozNSwidXJsZ2VuX3NvdXJjZSI6Ind3dyJ9&ccb=17-1&_nc_gid=JUh5kxrXgfut42mkmBIUhQ&_nc_ss=7a3a8&_nc_zt=28&oh=00_Af3fvCWCwCuqllRnHbkDXAxnYTafClKckCCnPCih93qoKQ&oe=69E34A60";

async function run() {
  await testMediaDownload(imageUrl, 'test_image.jpg');
  console.log('-------------------');
  await testMediaDownload(videoUrl, 'test_video.mp4');
}

run();

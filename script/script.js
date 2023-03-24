//get canvas element
const canvas=document.getElementById("image");
//get link paragraph element
const paragraph=document.getElementById("img_details");
//create image element
const img=new Image();
//response variable
let response=0;
//max width and height
const MAX_WIDTH=400;
const MAX_HEIGHT=600;

//class to automatically slice image in 4 sections and store data 
class slicedImage
{
    w=0;
    h1=0;
    h2=0;
    h3=0;
    h4=0;
    data1=[];
    data2=[];
    data3=[];
    data4=[];
    constructor(imageData, width, height)
    {
        this.w=width;

        //calculate height of each slice
        this.h1=Math.floor(height/4);
        this.h2=this.h1;
        this.h3=this.h1;
        //last slice is the remaining height in case division is not exact
        this.h4=height - 3*this.h1;

        //slice imagedata vector
        this.data1=imageData.slice(0, width*this.h1 *4);
        this.data2=imageData.slice(width*this.h1*4, width*this.h2*4 + width*this.h1*4);
        this.data3=imageData.slice(width*this.h2*4 + width*this.h1*4,  width*this.h2*4 + width*this.h1*4 + width*this.h3*4);
        this.data4=imageData.slice(width*this.h3*4 + width*this.h2*4 + width*this.h1*4, width*height*4);
    }
}

document.getElementById("get_image").addEventListener('click', get_image);


function get_image()
{
    //get data from api
    fetch("https://dog.ceo/api/breeds/image/random")
        //when response is received extract data
        .then((response) => response.json())
        //process the data
        .then((data) => 
        {
           // console.log(data)
            //parse JSON data
            response=data;
            console.log(response.message);
            //turn image link to local blob
            
            //draw image from link
            draw_image(response.message); 
            
        }); 
    
}

async function draw_image(img_link)
{
    //check if browser supports canvas
    if(canvas.getContext)
    {
        //get 2d context of canvas
        const ctx=canvas.getContext("2d");

        //set canvas size
        ctx.canvas.width=MAX_WIDTH*2;
        ctx.canvas.height=MAX_HEIGHT;
        
        //set image source
        // img.src=img_link;

        //get image blob
        img.src=await toObjectUrl(img_link);
        console.log("acolo");
        console.log(img_link);
        console.log("img.src blob: "+img.src);

        //once image is loaded
        img.onload=(event)=>
        {
            let height=img.height;
            let width=img.width;
            
            //tall image case
            if (height*(MAX_WIDTH/width)>MAX_HEIGHT)
            {
                //calculate width
                width=width*(MAX_HEIGHT/height);
                //height is max
                height=MAX_HEIGHT;
            }
            //wide image case
            else
            {
                //calculate height
                height=height*(MAX_WIDTH/width);
                //width is max
                width=MAX_WIDTH;
            }

            //draw original image on left side
            ctx.drawImage(img,0,0,width,height);

            //get imagedata as a vector of rgba values
            let imageData = ctx.getImageData(0,0, width, height);
            console.log( imageData);

            //create object with sliced image data
            let slice=new slicedImage(imageData.data, width, height);
            console.log(slice);

            //process each slice of the image
            let processing_time= process_image_slice(slice);

            // //start logging processing time
            // const t0=performance.now();
            // let temp=gaussian_filter(slice.data1, width, slice.h1);
            // //temp=sobel_operator(temp, width, height );

            // //create a blank imageData vector
            // processed_imageData = ctx.createImageData(width, slice.h1);
            
            // //draw image slice
            // ctx.putImageData(processed_imageData, width+1, 0 )

            // const t1=performance.now();

            
            //create a blank imageData vector
            processed_imageData = ctx.createImageData(width, slice.h1);
            //set processed imagedata data
            processed_imageData.data.set(slice.data1);
            //draw image copy
            ctx.putImageData(processed_imageData, width+1, 0 );

             //set processed imagedata data
             processed_imageData.data.set(slice.data2);
             //draw image copy
             ctx.putImageData(processed_imageData, width+1, slice.h1 );

             //set processed imagedata data
             processed_imageData.data.set(slice.data3);
             //draw image copy
             ctx.putImageData(processed_imageData, width+1, slice.h1 +slice.h2 );

             //create a blank imageData vector
            processed_imageData = ctx.createImageData(width, slice.h4);
             //set processed imagedata data
             processed_imageData.data.set(slice.data4);
             //draw image copy
             ctx.putImageData(processed_imageData, width+1, slice.h1 +slice.h2 + slice.h3 );

            //write image details to paragraph
            paragraph.textContent="Image: "+img_link + ",  " + processing_time;
            console.log(processing_time);
        }
    }
}


function gaussian_filter(imageData, width, height)
{
    //convolution matrix
    
    const conv_filter= [
        [2, 4,  5,  4,  2],
        [4, 9,  12, 9,  4],
        [5, 12, 15, 12, 5],
        [2, 4,  5,  4,  2],
        [4, 9,  12, 9,  4]
    ];
    
    //ne image buffer
    buffer = new Uint8ClampedArray(imageData.length);
    console.log("ok"+imageData.length);
    for (let i=0;i<imageData.length; i+=4)
    {
        //sum of each channel
        let sum=[0,0,0];
        //current divider
        let divider=0;

        //check rows on top
        if(i-width*8>=0 ) { upper_limit=0; }
        else{ if(i-width*4>=0) { upper_limit=1;} else upper_limit=2;}

        //check bottom rows
        if(i-width*8<imageData.length ) { lower_limit=5; }
        else{ if(i-width*4<imageData.length) { lower_limit=4;} else lower_limit=3; }

        //check left
        if(i-8>=0 ) { left_limit=0; }
        else{ if(i-4>=0) { left_limit=1;} else left_limit=2; }

        //check right
        if(i-8<imageData.length ) { right_limit=5; }
        else{ if(i-4<imageData.length) { right_limit=4;} else right_limit=3; }


        //apply conv matrix on pixel
        for(let line=upper_limit; line<lower_limit; line++)
        {
            for(let col=left_limit; col<right_limit; col++)
            {
                //add value to divider
                divider=divider + conv_filter[line][col];

                //add r,g,b values to sum
                sum[0]=sum[0] + imageData.at(i+(line-2)*width*4 + (col-2)*4)*conv_filter[line][col];
                sum[1]=sum[1] + imageData.at(i+(line-2)*width*4 + (col-2)*4 + 1)*conv_filter[line][col];
                sum[2]=sum[2] + imageData.at(i+(line-2)*width*4 + (col-2)*4 + 2)*conv_filter[line][col];
            }
        }
        //push new pixel values and alpha
        buffer[i]=sum[0]/divider;
        buffer[i+1]=sum[1]/divider;
        buffer[i+2]=sum[2]/divider;
        buffer[i+3]=255;
        
    }
    
    return buffer;
}

function sobel_operator(imageData, width, height)
{
    //horizontal derivatives matrix
    const gX= [
        [1, 0, -1],
        [2, 0, -2],
        [1, 0, -1]
    ];
    //vertical derivatives matrix
    const gY= [
        [1,   2,  1],
        [0,   0,  0],
        [-1, -2, -1]
    ];

    //treshold
    let threshold=120;
    
    //ne image buffer
    buffer = new Uint8ClampedArray(imageData.length);
    console.log("ok: "+ imageData.length);
    //apply horizontal and vertical derivatives convolution
    for(let i=0;i<imageData.length;i+=4)
    {
        let rh=0, gh=0, bh=0, rv=0, gv=0, bv=0, lh=0, lv=0;
        for(let line=0;line<3;line++)
        {
            for (let col=0;col<3;col++)
            {
                //add r,g,b values to horizontal sums 
                //convert to grayscale
                rh=rh + imageData.at(i+(line-1)*width*4 + (col-1)*4)*gX[line][col] *0.2126;
                gh=gh + imageData.at(i+(line-1)*width*4 + (col-1)*4 + 1)*gX[line][col] * 0.7152;
                bh=bh + imageData.at(i+(line-1)*width*4 + (col-1)*4 + 2)*gX[line][col] *0.0722;
                lh=rh+gh+bh;

                //add r,g,b values to vertical sums
                //convert to grayscale
                rv=rv + imageData.at(i+(line-1)*width*4 + (col-1)*4)*gY[line][col] * 0.2126;
                gv=gv + imageData.at(i+(line-1)*width*4 + (col-1)*4 + 1)*gY[line][col] * 0.7152;
                bv=bv + imageData.at(i+(line-1)*width*4 + (col-1)*4 + 2)*gY[line][col] * 0.0722;
                lv=rv+gv+bv;
            }

                
        }
        //calculate resulting pixel and add threshold
        // buffer[i]=Math.sqrt(Math.pow(rh,2)+Math.pow(rv,2));
        // if(buffer[i]<threshold) buffer[i]=0;
        // buffer[i+1]=Math.sqrt(Math.pow(gh,2)+Math.pow(gv,2))/8;
        // if(buffer[i+1]<threshold) buffer[i+1]=0;
        // buffer[i+2]=Math.sqrt(Math.pow(bh,2)+Math.pow(bv,2))/8;
        // if(buffer[i+2]<threshold) buffer[i+2]=0;
        let luminosity=Math.sqrt(Math.pow(lh,2)+Math.pow(lv,2));
        if(luminosity<threshold) luminosity=0;
        buffer[i]=buffer[i+1]=buffer[i+2]=luminosity;
        buffer[i+3]=255;
        
    }

    return buffer;
}

function process_image_slice(slice)
{
    let processing_time="Processing time: ";

    //get 2d context of canvas
    const ctx=canvas.getContext("2d");

    //start logging processing time
    t0=performance.now();
    slice.data1=gaussian_filter(slice.data1, slice.w, slice.h1);
    slice.data1=sobel_operator(slice.data1, slice.w, slice.h1 );

    t1=performance.now();

    processing_time= processing_time+ "s1: "+ (t1-t0) + "ms ";


    //start logging processing time
    t0=performance.now();
    slice.data2=gaussian_filter(slice.data2, slice.w, slice.h2);
    slice.data2=sobel_operator(slice.data2, slice.w, slice.h2 );

    t1=performance.now();

    processing_time= processing_time+"s2: "+ (t1-t0) + "ms ";


    //start logging processing time
    t0=performance.now();
    slice.data3=gaussian_filter(slice.data3, slice.w, slice.h3);

    t1=performance.now();

    processing_time= processing_time+"s3: "+ (t1-t0) + "ms ";

    //start logging processing time
    t0=performance.now();
    slice.data4=gaussian_filter(slice.data4, slice.w, slice.h4);

    t1=performance.now();

    processing_time= processing_time+"s4: "+ (t1-t0) + "ms ";

    return processing_time;
}

//fetch image and make local blob
async function toObjectUrl(url) {
    //fetch from service to work around cors
    return fetch("https://api.codetabs.com/v1/proxy?quest=" + url)
        .then((response)=> {
          return response.blob();
        })
        .then((blob)=> {
            console.log("aici");
          return URL.createObjectURL(blob);
        });
  }

  
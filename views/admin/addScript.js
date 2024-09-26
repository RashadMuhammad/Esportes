let cropper1, cropper2, cropper3;

document.getElementById('imageUpload1').addEventListener('change', function (event) {
  handleFileUpload(event, 'imagePreview1', 'croppedImage1', cropper1);
});

document.getElementById('imageUpload2').addEventListener('change', function (event) {
  handleFileUpload(event, 'imagePreview2', 'croppedImage2', cropper2);
});

document.getElementById('imageUpload3').addEventListener('change', function (event) {
  handleFileUpload(event, 'imagePreview3', 'croppedImage3', cropper3);
});

function handleFileUpload(event, previewId, hiddenFieldId, cropper) {
  const file = event.target.files[0];
  if (file) {
    const imgURL = URL.createObjectURL(file);
    const previewImage = document.getElementById(previewId);
    previewImage.src = imgURL;
    previewImage.style.display = 'block';

    if (cropper) {
      cropper.destroy(); // Destroy previous cropper instance
    }

    cropper = new Cropper(previewImage, {
      aspectRatio: 1,
      viewMode: 2,
      ready() {
        // You can do something when the cropper is ready
      }
    });

    // Store cropper instance
    window[hiddenFieldId] = cropper;
  }
}

document.getElementById('addProductForm').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent form submission

  // Get cropped images as blobs
  const formData = new FormData();
  formData.append('productNo', document.getElementById('productNo').value);
  formData.append('name', document.getElementById('name').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('stock', document.getElementById('stock').value);
  formData.append('price', document.getElementById('price').value);

  let imageUploadPromises = [];
  ['1', '2', '3'].forEach((i) => {
    const cropper = window[`croppedImage${i}`];
    if (cropper) {
      const promise = new Promise((resolve, reject) => {
        cropper.getCroppedCanvas().toBlob((blob) => {
          if (blob) {
            formData.append(`images`, blob, `image${i}.png`);
            resolve();
          } else {
            reject('Error cropping image');
          }
        });
      });
      imageUploadPromises.push(promise);
    }
  });

  Promise.all(imageUploadPromises).then(() => {
    fetch('/admin/products/add', {
      method: 'POST',
      body: formData,
    })
      .then(data => {
        console.log(data);
        alert('Product added successfully!');
      })
      .catch(error => {
        console.error(error);
        alert('An error occurred while uploading the product.');
      });
  }).catch(error => {
    console.error(error);
    alert('Error processing images');
  });
});


document.getElementById('editProductForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  formData.append('id', e.target.dataset.id);

  // Array to store promises for image cropping
  let imageUploadPromises = [];

  // Now make the fetch call after all images have been processed
  // fetch('/admin/products/edit', {
  //   method: 'POST',
  //   body: formData,
  // })
  //   .then(response => response.json())  // Handle the fetch response
  //   .then(data => {
  //     console.log('Success:', data);  // Log the success response
  //     alert("data updated successfully")
  //     location.reload()
  //   })
  //   .catch((error) => {
  //     console.error('Error:', error);  // Log any errors in cropping or fetch
  //     alert("data updated failed")
  //   });

  this.submit()
})


<?php

// process_payment.php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone = $_POST['phone_number'];
    $amount = $_POST['amount'];

    // M-Pesa credentials and API URL
    $consumerKey = 'YlahCCoUqdHVGvOcWLkxu215IaMQAb5AwALL47OgUuitnisS';
    $consumerSecret = 'YoC2bw4TprsokB2EyAO2brbTQ8wNMCobbZqcxIUdM7vU16fh3F802iGAoO1CsAvx';
    $shortcode = '174379'; //hii ni tu a sbusiness code provided by mpesa daraja api
    $lipaNaMpesaOnlinePasskey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    $lipaNaMpesaOnlineUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    $callbackUrl = 'https://8c2a-105-163-0-112.ngrok-free.app/callback';

    // Generate the password
    $timestamp = date('YmdHis');
    $password = base64_encode($shortcode . $lipaNaMpesaOnlinePasskey . $timestamp);

    // Retrieve access token
    $accessTokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    $curl = curl_init($accessTokenUrl);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Authorization: Basic '. base64_encode($consumerKey.':'.$consumerSecret))); // Set Headers
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    $curlResponse = curl_exec($curl);
    $accessToken = json_decode($curlResponse)->access_token;
    curl_close($curl);

    // Request data
    $curlPostData = [
        'BusinessShortCode' => $shortcode,
        'Password' => $password,
        'Timestamp' => $timestamp,
        'TransactionType' => 'CustomerPayBillOnline',
        'Amount' => $amount,
        'PartyA' => $phone,
        'PartyB' => $shortcode,
        'PhoneNumber' => $phone,
        'CallBackURL' => $callbackUrl,
        'AccountReference' => 'YOUR_ACCOUNT_REFERENCE',
        'TransactionDesc' => 'Payment for goods or services'
    ];

    $curl = curl_init($lipaNaMpesaOnlineUrl);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type:application/json','Authorization:Bearer '.$accessToken));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($curlPostData));
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    $curlResponse = curl_exec($curl);

    // Handle the response
    if ($curlResponse) {
        $response = json_decode($curlResponse, true);
        // Log the response or handle it according to your needs
        echo json_encode($response);
    } else {
        // Handle the error
        echo json_encode(['error' => 'Failed to initiate payment.']);
    }

    curl_close($curl);
}

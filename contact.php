<?php
    if(isset($_POST['submit'])) {
        $name = $_POST['name']; 
        $subject = $_POST['subject']; 
        $mailFrom = $_POST['mail']; 
        $message = $_POST['message']; 
        $phone = $_POST['phone']; 

        $mailTo = "davidvladuca@gmail.com";
        $headers = "De la: ".$mailFrom." cu numarul: ".$phone;
        $txt = "Ai primit un email de la: ".$name.".\n\n".$message;

        mail($mailTo, $subject, $txt, $headers);
        header('Location: aboutRO.html');
        echo '<script>alert("Mesajul a fost trimis! /nVa vom contacta inapoi cat se poate de rapid.")</script>';
    }   
?>

<script>
    function myalert() {
        alert("Mesajul a fost trimis!\n" + "Va vom contacta noi inapoi cat se poate de rapid.")
    }
</script>
#include <iostream>
#include <curl/curl.h>

using namespace std;

int main() {
    CURL *curl;
    CURLcode res;

    string server_url = "http://192.168.1.100:3000/rfid";  // Remplace par l'IP de la Raspberry Pi 2
    string rfid_id = "123456789";  // Simulé, remplace avec la valeur lue par ton capteur RFID
    string json_data = "{\"rfid\": \"" + rfid_id + "\"}";

    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();

    if (curl) {
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");

        curl_easy_setopt(curl, CURLOPT_URL, server_url.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_data.c_str());

        res = curl_easy_perform(curl);
        if (res != CURLE_OK)
            cerr << "Erreur lors de l'envoi de la requête : " << curl_easy_strerror(res) << endl;
        else
            cout << "✅ Données envoyées avec succès !" << endl;

        curl_easy_cleanup(curl);
    }

    curl_global_cleanup();
    return 0;
}

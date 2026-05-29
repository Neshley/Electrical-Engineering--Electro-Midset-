const currentVersion = '1.1.0'; //update this with your app's current version
const updateUrl ='https://yourserver.com/version.json';

document.getElementById('checkUpdate').addEventListener('click',checkForUpdate);

function checkForUpdate() {
    fetch(updateUrl)
    .then(response => response.json())
    .then(data => {
        const latestVersion = data.latestVersion;
        const updateLink = data.updateLink = data.updateUrl;

        if(compareVersions(latestVersion,currentVersion) >0){
            const updateHtml ='
            <p class="update-available">Update available:${latestVersion}</p>
            <a href="${updateLink}"target="_blank">Click here to update</a>';

            document.getElementById('updateStatus').innerHTML =updateHtml;
        }else{
            const upToDateHTML ='
            <p class="up-to-date"> 🎉 You are up to date 🎉 </p>
            <p>Current Version: ${currentVersion}</p>';

            document.getElementById(
                'updateStatus').innerHTML = upToDateHTML;
        }
    })
    .catch(error => console.error('Error'))
}






















